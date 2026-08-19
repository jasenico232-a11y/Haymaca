import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/booking/schema";
import { startCheckout } from "@/lib/booking/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "bookings"), 10, 60_000);
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

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const result = await startCheckout({
    holdId: parsed.data.holdId,
    lead: parsed.data.lead,
    origin: new URL(request.url).origin,
  });

  if (!result.ok)
    return NextResponse.json({ error: result.reason }, { status: 409 });

  return NextResponse.json({
    reference: result.reference,
    redirectUrl: result.redirectUrl,
    hostedFields: result.hostedFields ?? null,
    depositCents: result.depositCents,
    totalCents: result.totalCents,
  });
}
