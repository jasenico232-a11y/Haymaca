# Booking and payments: Supabase schema

The app talks to a `BookingStore` interface (`lib/booking/store.ts`). Today an
in-memory implementation backs it so the whole flow is testable without a
database. In production the same surface is backed by Supabase using the schema
below. **This SQL is not run by the app**; apply it as a migration.

The one behaviour the store must guarantee is that holding seats is atomic under
concurrency (no overselling). In memory that is a mutex; in Postgres it is a
single `UPDATE ... WHERE seats_available >= p_party` guarded row, exposed as an
RPC so the whole check-and-decrement is one statement.

```sql
-- ---------- enums -----------------------------------------------------------
create type departure_status as enum ('scheduled', 'cancelled_weather');
create type booking_status as enum (
  'pending_payment', 'confirmed', 'payment_failed', 'hold_expired', 'cancelled'
);
create type cancellation_kind as enum ('customer', 'weather');

-- ---------- departures ------------------------------------------------------
create table departures (
  id                   text primary key,          -- e.g. "reach-falls-hike__2026-09-14"
  tour_slug            text not null,
  date                 date not null,
  seats_total          int  not null check (seats_total >= 0),
  seats_available      int  not null check (seats_available >= 0),
  price_usd_per_person numeric(10,2) not null check (price_usd_per_person >= 0),
  deposit_pct          numeric(4,3)  not null check (deposit_pct > 0 and deposit_pct <= 1),
  status               departure_status not null default 'scheduled'
);
create index on departures (tour_slug, date);

-- ---------- holds -----------------------------------------------------------
create table holds (
  id           uuid primary key default gen_random_uuid(),
  departure_id text not null references departures(id),
  party_size   int  not null check (party_size between 1 and 12),
  status       text not null default 'active'
                 check (status in ('active','consumed','released')),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index on holds (departure_id) where status = 'active';

-- ---------- bookings --------------------------------------------------------
create table bookings (
  id            uuid primary key default gen_random_uuid(),
  reference     uuid not null unique default gen_random_uuid(),  -- customer-facing, unguessable
  departure_id  text not null references departures(id),
  tour_slug     text not null,
  hold_id       uuid not null references holds(id),
  party_size    int  not null check (party_size between 1 and 12),
  lead_name     text not null,
  lead_email    text not null,
  lead_phone    text not null,
  total_cents   int  not null check (total_cents >= 0),   -- computed server-side
  deposit_cents int  not null check (deposit_cents >= 0), -- charged now
  currency      text not null default 'USD',
  payment_ref   text unique,                              -- provider reference
  status        booking_status not null default 'pending_payment',
  eticket_issued boolean not null default false,
  cancellation_kind cancellation_kind,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on bookings (departure_id);
create index on bookings (payment_ref);

-- ---------- processed webhook events (idempotency) --------------------------
-- The primary key on event_id makes a replayed webhook a no-op insert.
create table payment_events (
  event_id     text primary key,   -- provider's unique event id
  payment_ref  text not null,
  type         text not null,
  processed_at timestamptz not null default now()
);

-- ---------- atomic seat hold ------------------------------------------------
-- Returns the new hold id, or null when there is not enough room. The single
-- guarded UPDATE is what prevents two concurrent callers overselling.
create or replace function hold_seats(p_departure_id text, p_party int)
returns uuid
language plpgsql
as $$
declare
  v_hold uuid;
begin
  update departures
     set seats_available = seats_available - p_party
   where id = p_departure_id
     and status = 'scheduled'
     and seats_available >= p_party;
  if not found then
    return null;
  end if;

  insert into holds (departure_id, party_size, expires_at)
  values (p_departure_id, p_party, now() + interval '15 minutes')
  returning id into v_hold;
  return v_hold;
end;
$$;

-- A scheduled job releases expired holds and returns their seats.
create or replace function release_expired_holds()
returns void
language plpgsql
as $$
begin
  with expired as (
    update holds set status = 'released'
     where status = 'active' and expires_at <= now()
     returning departure_id, party_size
  )
  update departures d
     set seats_available = seats_available + e.party_size
    from expired e
   where d.id = e.departure_id;
end;
$$;
```

## Row Level Security

- `bookings`, `holds`, `departures`, `payment_events`: **no** anon read/write.
  All access is through server routes using the service role key (server-only,
  never `NEXT_PUBLIC_`).
- Customers reach a booking only by its unguessable `reference` uuid, via the
  rate-limited `/booking/[reference]` route, never by direct table access.
- The `/operator` view reads manifests through an authenticated server session,
  not the anon key.

## Confirmation is server-only

`payment_ref` is set when checkout starts. A booking moves to `confirmed` **only**
inside the webhook handler (signature-verified) or a server-side `getStatus`
reconciliation, never from a client request. `payment_events.event_id` being the
primary key means the confirming insert is idempotent: a provider retry cannot
create or double-confirm a booking.

## What is deliberately never stored

No card numbers, CVVs, or PANs. Card data goes straight from the customer to the
provider's hosted page or hosted fields; we keep only the provider `payment_ref`.
