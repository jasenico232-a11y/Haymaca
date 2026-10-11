# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Visitors planning a Jamaica trip, mostly on a phone, reading in English or Spanish. Some want a whole trip arranged; others want a single guided day out with a date and a price.
- Operators and guides running departures, who check guests in by scanning e-tickets on a phone, sometimes with no signal.

## Product Purpose

Haymaca is a Kingston travel studio. The site does two jobs:

1. Earn the first enquiry for a planned trip (private and small-group), which a person answers on WhatsApp within one working day.
2. Sell guided tours and excursions from a filterable catalogue, hold seats against a deposit, and issue signed e-tickets that operators scan.

Success is a sent enquiry or a paid deposit, and a guest who arrives at the right town on the right day.

## Positioning

Local knowledge stated as fact: the town each tour leaves from, the parish the guide comes from, real prices in USD, real next dates. A competitor's template cannot copy the island's own geography, which is why the coastline is the site's organising device.

## Operating Context

- Enquiries hand off to WhatsApp with the answers pre-written; there is no account or login for visitors.
- Bookings: seats are held for 15 minutes while the deposit is paid through a hosted provider; card data never reaches Haymaca.
- Operators use a passcode-gated manifest and a scanner that queues check-ins offline and syncs later.

## Capabilities and Constraints

- Next.js 15 App Router, Tailwind token layer, en and es under `app/[locale]`, nonce CSP.
- Six tour categories, five departure towns (Montego Bay, Black River, Treasure Beach, Kingston, Port Antonio), 13 seed tours in `lib/tours/data.ts`.
- The booking store is in-memory today; production needs the Supabase implementation in `docs/payments-supabase.md`.
- Tokens, type scale (14 to 60 px), two radii and the two typefaces are pinned by the build spec.

## Brand Commitments

- Name: Haymaca, from the Taíno name for the island, "land of wood and water".
- Voice: plain, specific, first person plural. Facts over adjectives; no banned copy from `AGENTS.md`.
- `sun` is reserved for calls to action.

## Evidence on Hand

- No location photography yet. The coastline drawings stand in for it and must not be replaced with stock images.
- Coastline: Natural Earth 1:10m and 1:50m (public domain), in `lib/geo/jamaica.ts`.
- Contact details, the studio address, "since 2016" and the Jamaica Tourist Board licence line appear in the copy and must be confirmed by the client before launch. The phone number is a 555 number.

## Product Principles

1. Every claim on a page is a fact a visitor could check: a town, a date, a price, a duration.
2. Geography first. "Where does this start?" is answered before "what is it like?".
3. One clear next step per surface: enquire, or book a seat.
4. Works on a phone with weak signal, for visitors and operators alike.

## Accessibility & Inclusion

WCAG 2.2 AA, 44 px tap targets, full Spanish parity, category colour always paired with an icon and a name, reduced motion honoured.
