import { NextResponse } from "next/server";
import { getBookingStore } from "@/lib/booking/store";

/**
 * Test-only seam, gated behind ENABLE_TEST_HOOKS. Returns booking counts and,
 * optionally, a single booking by ?reference= so the test can assert exactly one
 * booking exists and inspect its status.
 */
export async function GET(request: Request) {
  if (process.env.ENABLE_TEST_HOOKS !== "1")
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const store = getBookingStore();
  const all = store.listAllBookings();
  const reference = new URL(request.url).searchParams.get("reference");
  const one = reference ? store.getBookingByReference(reference) : null;

  return NextResponse.json({
    totalBookings: all.length,
    confirmed: all.filter((b) => b.status === "confirmed").length,
    booking: one
      ? {
          reference: one.reference,
          status: one.status,
          eTicketIssued: one.eTicketIssued,
          depositCents: one.depositCents,
          totalCents: one.totalCents,
        }
      : null,
  });
}
