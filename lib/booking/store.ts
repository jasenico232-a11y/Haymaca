import { randomUUID } from "node:crypto";
import type {
  Booking,
  CancellationKind,
  Departure,
  Hold,
  Lead,
} from "./types";
import { seedDepartures } from "./departures";
import type { VerifiedEvent } from "@/lib/payments/provider";

export const HOLD_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Serializes mutations so seat maths is atomic under concurrency. */
class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => T | Promise<T>): Promise<T> {
    const result = this.tail.then(fn, fn);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

export type HoldResult =
  | { ok: true; hold: Hold }
  | { ok: false; reason: "departure_not_found" | "departure_cancelled" | "sold_out" };

export type ApplyOutcome =
  | "duplicate"
  | "unknown_ref"
  | "already_final"
  | "confirmed"
  | "hold_expired"
  | "failed"
  | "refunded";

/**
 * In-memory implementation of the booking store. It is the single owner of seat
 * counts, holds, bookings and processed webhook events. In production the same
 * surface is backed by Supabase (see docs/payments-supabase.md); the atomicity
 * the Mutex gives here is provided there by row locks / a decrement RPC.
 */
export class InMemoryBookingStore {
  private departures = new Map<string, Departure>();
  private holds = new Map<string, Hold>();
  private bookings = new Map<string, Booking>();
  private refToId = new Map<string, string>();
  private paymentRefToId = new Map<string, string>();
  private processedEvents = new Set<string>();
  private mutex = new Mutex();

  constructor() {
    for (const departure of seedDepartures())
      this.departures.set(departure.id, departure);
  }

  private sweepExpired(now: number): void {
    for (const hold of this.holds.values()) {
      if (hold.status === "active" && hold.expiresAt <= now) {
        hold.status = "released";
        const departure = this.departures.get(hold.departureId);
        if (departure) departure.seatsAvailable += hold.partySize;
      }
    }
  }

  getDeparture(id: string): Departure | null {
    return this.departures.get(id) ?? null;
  }

  /** Next scheduled departure of the same tour with room, after a given date. */
  nextDepartureFor(
    tourSlug: string,
    partySize: number,
    afterDate: string,
  ): Departure | null {
    this.sweepExpired(Date.now());
    const candidates = [...this.departures.values()]
      .filter(
        (d) =>
          d.tourSlug === tourSlug &&
          d.status === "scheduled" &&
          d.date > afterDate &&
          d.seatsAvailable >= partySize,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    return candidates[0] ?? null;
  }

  holdSeats(departureId: string, partySize: number): Promise<HoldResult> {
    return this.mutex.run(() => {
      const now = Date.now();
      this.sweepExpired(now);
      const departure = this.departures.get(departureId);
      if (!departure) return { ok: false, reason: "departure_not_found" };
      if (departure.status !== "scheduled")
        return { ok: false, reason: "departure_cancelled" };
      if (departure.seatsAvailable < partySize)
        return { ok: false, reason: "sold_out" };

      departure.seatsAvailable -= partySize;
      const hold: Hold = {
        id: randomUUID(),
        departureId,
        partySize,
        expiresAt: now + HOLD_TTL_MS,
        status: "active",
      };
      this.holds.set(hold.id, hold);
      return { ok: true, hold };
    });
  }

  getHold(id: string): Hold | null {
    this.sweepExpired(Date.now());
    return this.holds.get(id) ?? null;
  }

  createBooking(input: {
    departureId: string;
    tourSlug: string;
    holdId: string;
    partySize: number;
    lead: Lead;
    requirements?: string | null;
    totalCents: number;
    depositCents: number;
  }): Promise<Booking> {
    return this.mutex.run(() => {
      const now = Date.now();
      const booking: Booking = {
        id: randomUUID(),
        reference: randomUUID(),
        departureId: input.departureId,
        tourSlug: input.tourSlug,
        holdId: input.holdId,
        partySize: input.partySize,
        lead: input.lead,
        requirements: input.requirements ?? null,
        totalCents: input.totalCents,
        depositCents: input.depositCents,
        currency: "USD",
        paymentRef: null,
        status: "pending_payment",
        eTicketIssued: false,
        checkedInAt: null,
        cancellation: null,
        createdAt: now,
        updatedAt: now,
      };
      this.bookings.set(booking.id, booking);
      this.refToId.set(booking.reference, booking.id);
      return booking;
    });
  }

  attachPaymentRef(bookingId: string, paymentRef: string): Promise<void> {
    return this.mutex.run(() => {
      const booking = this.bookings.get(bookingId);
      if (!booking) return;
      booking.paymentRef = paymentRef;
      booking.updatedAt = Date.now();
      this.paymentRefToId.set(paymentRef, bookingId);
    });
  }

  getBookingByReference(reference: string): Booking | null {
    const id = this.refToId.get(reference);
    return id ? (this.bookings.get(id) ?? null) : null;
  }

  getBookingById(id: string): Booking | null {
    return this.bookings.get(id) ?? null;
  }

  /** Mark a confirmed guest checked in. Idempotent — a second scan is a no-op. */
  markCheckedIn(
    bookingId: string,
  ): Promise<{ ok: boolean; already: boolean; booking: Booking | null }> {
    return this.mutex.run(() => {
      const booking = this.bookings.get(bookingId);
      if (!booking || booking.status !== "confirmed")
        return { ok: false, already: false, booking: booking ?? null };
      if (booking.checkedInAt !== null)
        return { ok: true, already: true, booking };
      booking.checkedInAt = Date.now();
      booking.updatedAt = booking.checkedInAt;
      return { ok: true, already: false, booking };
    });
  }

  departuresOnDate(date: string): Departure[] {
    return [...this.departures.values()]
      .filter((d) => d.date === date)
      .sort((a, b) => a.tourSlug.localeCompare(b.tourSlug));
  }

  confirmedBookingsForDeparture(departureId: string): Booking[] {
    return [...this.bookings.values()].filter(
      (b) => b.departureId === departureId && b.status === "confirmed",
    );
  }

  /** Every real booking on a departure (confirmed or cancelled) — the manifest
   *  keeps showing cancelled guests so history is never lost. */
  bookingsForDeparture(departureId: string): Booking[] {
    return [...this.bookings.values()]
      .filter(
        (b) =>
          b.departureId === departureId &&
          (b.status === "confirmed" || b.status === "cancelled"),
      )
      .sort((a, b) => a.lead.name.localeCompare(b.lead.name));
  }

  /**
   * Apply a verified payment event. Idempotent twice over: a replayed event id is
   * a no-op, and a booking already in a final state is never re-confirmed — so a
   * replay can never create or double-confirm a booking.
   */
  applyPaymentEvent(
    event: VerifiedEvent,
  ): Promise<{ outcome: ApplyOutcome; booking: Booking | null }> {
    return this.mutex.run(() => {
      if (this.processedEvents.has(event.eventId))
        return { outcome: "duplicate" as const, booking: null };
      this.processedEvents.add(event.eventId);

      const bookingId = this.paymentRefToId.get(event.ref);
      const booking = bookingId ? this.bookings.get(bookingId) : undefined;
      if (!booking) return { outcome: "unknown_ref" as const, booking: null };
      if (booking.status === "confirmed" || booking.status === "cancelled")
        return { outcome: "already_final" as const, booking };

      const now = Date.now();
      const hold = this.holds.get(booking.holdId);
      const departure = this.departures.get(booking.departureId);

      if (event.type === "payment.succeeded") {
        // The hold may have expired while the customer was on the hosted page.
        if (!hold || hold.status === "released" || hold.expiresAt <= now) {
          booking.status = "hold_expired";
          booking.updatedAt = now;
          return { outcome: "hold_expired" as const, booking };
        }
        hold.status = "consumed";
        booking.status = "confirmed";
        booking.updatedAt = now;
        return { outcome: "confirmed" as const, booking };
      }

      if (event.type === "payment.failed") {
        booking.status = "payment_failed";
        booking.updatedAt = now;
        if (hold && hold.status === "active") {
          hold.status = "released";
          if (departure) departure.seatsAvailable += hold.partySize;
        }
        return { outcome: "failed" as const, booking };
      }

      // refunded events for a not-yet-final booking: record without deleting.
      booking.updatedAt = now;
      return { outcome: "refunded" as const, booking };
    });
  }

  markETicketIssued(bookingId: string): Promise<void> {
    return this.mutex.run(() => {
      const booking = this.bookings.get(bookingId);
      if (booking) booking.eTicketIssued = true;
    });
  }

  /** Customer cancels their own booking. Status change, never a delete. */
  cancelBooking(
    reference: string,
    kind: CancellationKind,
  ): Promise<{ ok: boolean; booking: Booking | null }> {
    return this.mutex.run(() => {
      const id = this.refToId.get(reference);
      const booking = id ? this.bookings.get(id) : undefined;
      if (!booking) return { ok: false, booking: null };
      if (booking.status === "cancelled")
        return { ok: true, booking };
      booking.status = "cancelled";
      booking.cancellation = { kind, at: Date.now() };
      booking.updatedAt = Date.now();
      const hold = this.holds.get(booking.holdId);
      const departure = this.departures.get(booking.departureId);
      if (hold && hold.status !== "released") {
        hold.status = "released";
        if (departure) departure.seatsAvailable += hold.partySize;
      }
      return { ok: true, booking };
    });
  }

  /**
   * Weather cancellation of a whole departure. A status change that cancels every
   * booking on it (for refund + notification), and never deletes a record — the
   * booking history is preserved.
   */
  cancelDeparture(departureId: string): Promise<{
    departure: Departure | null;
    affected: Booking[];
  }> {
    return this.mutex.run(() => {
      const departure = this.departures.get(departureId);
      if (!departure) return { departure: null, affected: [] };
      departure.status = "cancelled_weather";
      const now = Date.now();
      const affected: Booking[] = [];
      for (const booking of this.bookings.values()) {
        if (
          booking.departureId === departureId &&
          booking.status !== "cancelled"
        ) {
          booking.status = "cancelled";
          booking.cancellation = { kind: "weather", at: now };
          booking.updatedAt = now;
          affected.push(booking);
        }
      }
      return { departure, affected };
    });
  }

  /** Test seam (gated behind ENABLE_TEST_HOOKS at the route): force a hold to
   *  look expired so the "hold expired mid-checkout" path can be exercised. */
  forceExpireHold(holdId: string): boolean {
    const hold = this.holds.get(holdId);
    if (!hold) return false;
    hold.expiresAt = Date.now() - 1000;
    return true;
  }

  // --- reads used by the operator view -----------------------------------
  listConfirmedBookings(): Booking[] {
    return [...this.bookings.values()].filter((b) => b.status === "confirmed");
  }

  listAllBookings(): Booking[] {
    return [...this.bookings.values()];
  }

  listDepartures(): Departure[] {
    return [...this.departures.values()];
  }
}

// Singleton, stashed on globalThis so dev HMR does not reset seat state.
const globalStore = globalThis as unknown as {
  __haymacaBookingStore?: InMemoryBookingStore;
};

export function getBookingStore(): InMemoryBookingStore {
  if (!globalStore.__haymacaBookingStore)
    globalStore.__haymacaBookingStore = new InMemoryBookingStore();
  return globalStore.__haymacaBookingStore;
}
