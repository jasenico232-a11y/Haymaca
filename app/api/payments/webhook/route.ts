import { NextResponse } from "next/server";
import { handleWebhook } from "@/lib/booking/service";

/**
 * The single confirmation path. Reads the RAW body (needed for signature
 * verification), passes it and the signature header to the provider-agnostic
 * handler, and returns 400 when the signature does not verify. Processing is
 * idempotent by event id and payment ref, so a provider retry (a replay) never
 * creates or double-confirms a booking.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-haymaca-signature");

  const result = await handleWebhook(rawBody, signature);
  if (!result.ok)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  return NextResponse.json({ received: true, outcome: result.outcome });
}
