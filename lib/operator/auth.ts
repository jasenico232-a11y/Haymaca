import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal operator authentication: a shared passcode exchanged for a signed,
 * expiring session cookie. Enough to gate the manifest and scan routes without a
 * full identity system; a real deployment swaps this for staff SSO.
 */
const SECRET =
  process.env.OPERATOR_SESSION_SECRET ?? "dev-operator-session-secret";
const PASSCODE = process.env.OPERATOR_PASSCODE ?? "haymaca-operator";
export const OPERATOR_COOKIE = "operator_session";
const TTL_MS = 12 * 60 * 60 * 1000;

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function issueSession(): string {
  const payload = `op:${Date.now() + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  if (!safeEqual(sign(payload), signature)) return false;
  const exp = Number(payload.split(":")[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

export function checkPasscode(input: unknown): boolean {
  return typeof input === "string" && safeEqual(input, PASSCODE);
}

export async function isOperatorAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(OPERATOR_COOKIE)?.value);
}

export function operatorAuthedFromRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|; )${OPERATOR_COOKIE}=([^;]+)`),
  );
  return verifySession(match?.[1] ? decodeURIComponent(match[1]) : undefined);
}
