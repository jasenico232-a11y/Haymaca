/**
 * Small in-memory fixed-window rate limiter. Good enough to blunt abuse of the
 * mutating and enumerable routes in a single-instance deployment; in production
 * on Supabase/edge this is backed by a shared store (Upstash/Postgres), same
 * signature. Keyed per client per route.
 */
type Window = { count: number; resetAt: number };

const globalBuckets = globalThis as unknown as {
  __haymacaRateBuckets?: Map<string, Window>;
};
const buckets =
  globalBuckets.__haymacaRateBuckets ??
  (globalBuckets.__haymacaRateBuckets = new Map());

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfter: 0 };
}

/** Derive a client key from the request. Trusts the proxy's forwarded IP. */
export function clientKey(request: Request, route: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${route}:${ip}`;
}
