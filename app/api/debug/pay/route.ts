import { NextResponse } from "next/server";
import { getBookingStore } from "@/lib/booking/store";
import { getMockProvider } from "@/lib/payments";

/**
 * Test-only seam, gated behind ENABLE_TEST_HOOKS. Stands in for the provider's
 * backend: given a booking reference it returns the exact signed webhook payload
 * the provider would POST. The test then delivers it to /api/payments/webhook —
 * posting it twice is a genuine replay.
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_TEST_HOOKS !== "1")
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json()) as {
    reference?: unknown;
    outcome?: unknown;
  };
  if (typeof body.reference !== "string")
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const booking = getBookingStore().getBookingByReference(body.reference);
  if (!booking || !booking.paymentRef)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const type =
    body.outcome === "failed" ? "payment.failed" : "payment.succeeded";
  const signed = getMockProvider().emitEvent(booking.paymentRef, type);
  return NextResponse.json(signed);
}
