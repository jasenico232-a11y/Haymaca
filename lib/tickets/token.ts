import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * E-ticket tokens. The QR encodes a SIGNED token (an HMAC over the booking id
 * and departure id), never the raw booking id. At scan time the operator route
 * recomputes the signature; a forged or edited token fails verification, so a
 * QR cannot be fabricated without the server secret.
 */
const SECRET = process.env.TICKET_SECRET ?? "dev-ticket-secret-change-me";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signTicket(bookingId: string, departureId: string): string {
  const payload = `${bookingId}:${departureId}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export function verifyTicket(
  token: string,
): { bookingId: string; departureId: string } | null {
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(signature, "utf8");
  if (
    expectedBuf.length !== givenBuf.length ||
    !timingSafeEqual(expectedBuf, givenBuf)
  ) {
    return null;
  }

  const [bookingId, departureId] = payload.split(":");
  if (!bookingId || !departureId) return null;
  return { bookingId, departureId };
}
