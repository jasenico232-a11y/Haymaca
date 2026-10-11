import { getPaymentProvider } from "@/lib/payments";
import type { BookingDraft } from "@/lib/payments/provider";
import { verifyTicket } from "@/lib/tickets/token";
import { getBookingStore } from "./store";
import { computeAmounts } from "./money";
import { logEvent } from "./log";
import type { Booking, Departure } from "./types";
import type { LeadInput } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const CUSTOMER_REFUND_DAYS = 7;

// --- side effects (mock today, real integrations later) -------------------
function sendETicket(booking: Booking): void {
  logEvent("eticket_sent", {
    reference: booking.reference,
    departureId: booking.departureId,
  });
}

function initiateRefund(booking: Booking): void {
  // A real provider adds a refund() call; the abstraction records the intent.
  logEvent("refund_initiated", {
    reference: booking.reference,
    paymentRef: booking.paymentRef,
    amountCents: booking.depositCents,
  });
}

function notifyWeatherCancellation(booking: Booking): void {
  logEvent("weather_cancellation_notified", {
    reference: booking.reference,
    departureId: booking.departureId,
  });
}

// --- flow ------------------------------------------------------------------

export type StartCheckoutResult =
  | {
      ok: true;
      reference: string;
      redirectUrl?: string;
      hostedFields?: unknown;
      depositCents: number;
      totalCents: number;
    }
  | { ok: false; reason: "hold_invalid" | "departure_unavailable" };

/**
 * Hold already placed → validate lead server-side → compute the deposit from the
 * departure record → create the booking → open a provider checkout for the
 * deposit only. Amounts are never taken from the client.
 */
export async function startCheckout(input: {
  holdId: string;
  lead: LeadInput;
  requirements?: string;
  origin: string;
}): Promise<StartCheckoutResult> {
  const store = getBookingStore();
  const hold = store.getHold(input.holdId);
  if (!hold || hold.status !== "active" || hold.expiresAt <= Date.now())
    return { ok: false, reason: "hold_invalid" };

  const departure = store.getDeparture(hold.departureId);
  if (!departure || departure.status !== "scheduled")
    return { ok: false, reason: "departure_unavailable" };

  const amounts = computeAmounts(
    departure.priceUsdPerPerson,
    hold.partySize,
    departure.depositPct,
  );

  const booking = await store.createBooking({
    departureId: departure.id,
    tourSlug: departure.tourSlug,
    holdId: hold.id,
    partySize: hold.partySize,
    lead: input.lead,
    requirements: input.requirements ?? null,
    totalCents: amounts.totalCents,
    depositCents: amounts.depositCents,
  });

  const draft: BookingDraft = {
    bookingId: booking.id,
    reference: booking.reference,
    tourSlug: booking.tourSlug,
    departureId: booking.departureId,
    partySize: booking.partySize,
    deposit: { amountCents: amounts.depositCents, currency: "USD" },
    total: { amountCents: amounts.totalCents, currency: "USD" },
    lead: input.lead,
    returnUrl: `${input.origin}/booking/${booking.reference}`,
  };

  const checkout = await getPaymentProvider().createCheckout(draft);
  await store.attachPaymentRef(booking.id, checkout.ref);
  logEvent("checkout_created", {
    reference: booking.reference,
    paymentRef: checkout.ref,
    depositCents: amounts.depositCents,
  });

  return {
    ok: true,
    reference: booking.reference,
    redirectUrl: checkout.redirectUrl,
    hostedFields: checkout.hostedFields,
    depositCents: amounts.depositCents,
    totalCents: amounts.totalCents,
  };
}

export type WebhookResult =
  | { ok: false }
  | { ok: true; outcome: string };

/**
 * The only path that can move a booking to confirmed. Verifies the signature,
 * applies the event idempotently, and issues the e-ticket exactly once.
 */
export async function handleWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  const event = await getPaymentProvider().verifyWebhook(rawBody, signature);
  if (!event) {
    logEvent("webhook_rejected", { reason: "bad_signature" });
    return { ok: false };
  }

  const { outcome, booking } = await getBookingStore().applyPaymentEvent(event);

  if (outcome === "confirmed" && booking) {
    sendETicket(booking);
    await getBookingStore().markETicketIssued(booking.id);
  }
  logEvent("webhook_applied", {
    paymentRef: event.ref,
    eventId: event.eventId,
    outcome,
  });
  return { ok: true, outcome };
}

/**
 * Server-side reconciliation for a redirect return, so we never trust a client
 * claim of payment. Safe to call repeatedly: it flows through the same
 * idempotent store path.
 */
export async function reconcileBooking(reference: string): Promise<Booking | null> {
  const store = getBookingStore();
  const booking = store.getBookingByReference(reference);
  if (!booking || booking.paymentRef === null) return booking;
  if (booking.status !== "pending_payment") return booking;

  const status = await getPaymentProvider().getStatus(booking.paymentRef);
  if (status === "paid") {
    const { outcome, booking: updated } = await store.applyPaymentEvent({
      ref: booking.paymentRef,
      eventId: `reconcile:${booking.paymentRef}`,
      type: "payment.succeeded",
      status: "paid",
      amount: { amountCents: booking.depositCents, currency: "USD" },
    });
    if (outcome === "confirmed" && updated) {
      sendETicket(updated);
      await store.markETicketIssued(updated.id);
    }
    return store.getBookingByReference(reference);
  }
  if (status === "failed") {
    await store.applyPaymentEvent({
      ref: booking.paymentRef,
      eventId: `reconcile-failed:${booking.paymentRef}`,
      type: "payment.failed",
      status: "failed",
      amount: { amountCents: booking.depositCents, currency: "USD" },
    });
    return store.getBookingByReference(reference);
  }
  return booking;
}

export function getBooking(reference: string): Booking | null {
  return getBookingStore().getBookingByReference(reference);
}

export type CheckInResult =
  | {
      ok: false;
      reason: "invalid_token" | "not_found" | "wrong_departure" | "not_confirmed";
    }
  | {
      ok: true;
      already: boolean;
      name: string;
      partySize: number;
      tourSlug: string;
    };

/**
 * Operator scan. Verifies the signed ticket server-side (a forged token fails
 * here), then marks the guest checked in. Idempotent: a re-scan reports
 * already-checked-in rather than erroring.
 */
export async function checkInByToken(token: string): Promise<CheckInResult> {
  const parsed = verifyTicket(token);
  if (!parsed) return { ok: false, reason: "invalid_token" };

  const store = getBookingStore();
  const booking = store.getBookingById(parsed.bookingId);
  if (!booking) return { ok: false, reason: "not_found" };
  if (booking.departureId !== parsed.departureId)
    return { ok: false, reason: "wrong_departure" };
  if (booking.status !== "confirmed")
    return { ok: false, reason: "not_confirmed" };

  const result = await store.markCheckedIn(booking.id);
  return {
    ok: true,
    already: result.already,
    name: booking.lead.name,
    partySize: booking.partySize,
    tourSlug: booking.tourSlug,
  };
}

/** When a hold expired mid-checkout, offer the next departure, never rebook. */
export function nextDepartureFor(booking: Booking): Departure | null {
  const store = getBookingStore();
  const departure = store.getDeparture(booking.departureId);
  const afterDate = departure?.date ?? "0000-00-00";
  return store.nextDepartureFor(booking.tourSlug, booking.partySize, afterDate);
}

export type CustomerCancelResult =
  | { ok: false; reason: "not_found" | "not_cancellable" }
  | { ok: true; booking: Booking; refundEligible: boolean };

export async function cancelByCustomer(
  reference: string,
): Promise<CustomerCancelResult> {
  const store = getBookingStore();
  const existing = store.getBookingByReference(reference);
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status !== "confirmed" && existing.status !== "pending_payment")
    return { ok: false, reason: "not_cancellable" };

  const departure = store.getDeparture(existing.departureId);
  const daysUntil = departure
    ? Math.floor((Date.parse(`${departure.date}T00:00:00Z`) - Date.now()) / DAY_MS)
    : 0;
  const refundEligible = daysUntil >= CUSTOMER_REFUND_DAYS;

  const { booking } = await store.cancelBooking(reference, "customer");
  if (!booking) return { ok: false, reason: "not_found" };
  if (refundEligible && booking.status === "cancelled") initiateRefund(booking);
  logEvent("booking_cancelled", {
    reference,
    kind: "customer",
    refundEligible,
  });
  return { ok: true, booking, refundEligible };
}

export async function cancelDepartureForWeather(departureId: string): Promise<{
  ok: boolean;
  affected: number;
}> {
  const store = getBookingStore();
  const { departure, affected } = await store.cancelDeparture(departureId);
  if (!departure) return { ok: false, affected: 0 };
  for (const booking of affected) {
    initiateRefund(booking);
    notifyWeatherCancellation(booking);
  }
  logEvent("departure_cancelled_weather", {
    departureId,
    affected: affected.length,
  });
  return { ok: true, affected: affected.length };
}
