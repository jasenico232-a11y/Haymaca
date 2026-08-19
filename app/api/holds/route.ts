import { NextResponse } from "next/server";
import { holdRequestSchema } from "@/lib/booking/schema";
import { getBookingStore } from "@/lib/booking/store";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "holds"), 20, 60_000);
  if (!limit.ok)
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = holdRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const result = await getBookingStore().holdSeats(
    parsed.data.departureId,
    parsed.data.partySize,
  );
  if (!result.ok)
    return NextResponse.json({ error: result.reason }, { status: 409 });

  return NextResponse.json({
    holdId: result.hold.id,
    expiresAt: result.hold.expiresAt,
  });
}
