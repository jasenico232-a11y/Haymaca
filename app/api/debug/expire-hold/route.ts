import { NextResponse } from "next/server";
import { getBookingStore } from "@/lib/booking/store";

/**
 * Test-only seam, gated behind ENABLE_TEST_HOOKS. Lets the test suite make a
 * live hold look expired so the "hold expired mid-checkout" path is exercisable.
 * Returns 404 in any environment where the flag is not explicitly set.
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_TEST_HOOKS !== "1")
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const holdId = (body as { holdId?: unknown }).holdId;
  if (typeof holdId !== "string")
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const ok = getBookingStore().forceExpireHold(holdId);
  return NextResponse.json({ ok });
}
