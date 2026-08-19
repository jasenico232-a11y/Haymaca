import { NextResponse } from "next/server";
import { checkInByToken } from "@/lib/booking/service";
import { operatorAuthedFromRequest } from "@/lib/operator/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Verifies a scanned e-ticket and checks the guest in. Auth-gated; the signed
 * token is verified server-side, so a forged QR is rejected here. Idempotent —
 * a repeated scan reports "already checked in".
 */
export async function POST(request: Request) {
  if (!operatorAuthedFromRequest(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limit = rateLimit(clientKey(request, "checkin"), 120, 60_000);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const token = (body as { token?: unknown }).token;
  if (typeof token !== "string")
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const result = await checkInByToken(token);
  if (!result.ok)
    return NextResponse.json({ error: result.reason }, { status: 422 });

  return NextResponse.json({
    checkedIn: true,
    already: result.already,
    name: result.name,
    partySize: result.partySize,
    tourSlug: result.tourSlug,
  });
}
