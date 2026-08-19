# Launch gate — hardening audit

Audited on the production build of this branch. Item 1 is a hard stop; it
passed. Thirteen items pass with evidence; item 9 (Lighthouse) carries a written
remediation because it must run against the deployed URL. Nothing was changed
silently — the fixes applied during the audit are listed in the second table.

## The fourteen

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | 20-concurrent-booking test still passes | **PASS** (hard stop) | 20 concurrent holds on a 14-seat departure → exactly **14** granted, 5 sold-out, 1 rate-limited. Never more than the seat cap. The store serializes seat maths behind a mutex (`lib/booking/store.ts`); Supabase uses a guarded `UPDATE` RPC (`docs/payments-supabase.md`). |
| 2 | Booking references are UUIDs, never sequential | **PASS** | `reference: randomUUID()` in `lib/booking/store.ts`; the customer-facing id is a v4 UUID, distinct from the internal id. |
| 3 | Prices recomputed server-side; tampered client price ignored | **PASS** | `POST /api/bookings` with injected `priceUsd/depositCents/totalCents/amount` → server returned deposit `4250` / total `17000` computed from the departure record (`computeAmounts`, `lib/booking/money.ts`). The request schema has no price field. |
| 4 | Webhook signature verification present and idempotent | **PASS** | Unsigned/wrong-signature webhook → `400`, booking unchanged. Replay of a valid webhook → one booking, e-ticket sent once (idempotent by event id **and** payment ref, `lib/booking/store.ts`). |
| 5 | No card data touches our servers or logs | **PASS** | Redirect / hosted-fields only (`PaymentProvider`); the mock checkout's card input is `disabled` and never submitted. The logger (`lib/booking/log.ts`) records references and outcomes only — no PAN, no signatures, no tokens. |
| 6 | Rate limiting on availability, hold, book, /booking/[reference] | **PASS** | `availability` (book page), `holds`, `bookings`, and the `/booking/[reference]` page each call `rateLimit(...)` (`lib/rate-limit.ts`). |
| 7 | No secret in `NEXT_PUBLIC_`; client bundle clean | **PASS** | No `NEXT_PUBLIC_` in source. Grep of `.next/static` for every dev secret value → 0 hits. All secrets are server-only env vars. |
| 8 | CSP enforcing, no `unsafe-inline` scripts | **PASS** | Response header is `Content-Security-Policy` (not report-only); `script-src` carries `'nonce-…'` + `'strict-dynamic'` and **no** `'unsafe-inline'`. `style-src` allows inline styles only (permitted — the ban is scripts). |
| 9 | Lighthouse mobile: Perf ≥ 90, A11y ≥ 95 (tour detail) | **REMEDIATION** | Cannot be run here — Lighthouse's perf score must come from the deployed URL under real throttling, not a sandbox. Design targets it: SSR + SSG, MapLibre code-split out of first load, self-hosted fonts, ≤ 130 KB first-load JS, reserved dimensions (CLS 0), semantic HTML, labelled controls. The A11y half is corroborated below by axe (0 critical/serious). **Run `lhci autorun` / PageSpeed on the deployed `/book/[tour]` before launch.** |
| 10 | First-load JS ≤ 130 KB gzipped | **PASS** | Largest route **122 KB** (`/[locale]/book/[tourSlug]`); `/tours` 110 KB, home 104 KB (Next's gzipped First Load JS). MapLibre (~530 KB) is a lazy chunk, excluded. |
| 11 | Both locales render fully; no hardcoded strings | **PASS** | `/en/*` and `/es/*` render; every visible string flows from `i18n/messages/*.json` (the en catalogue types the es one, so drift fails the build). No English leaks into `/es`. |
| 12 | axe-core zero critical/serious; category coding never colour-alone | **PASS** | axe-core (wcag2a/aa, wcag21a/aa) on `/en`, `/en/tours`, `/en/book/[tour]`, `/es/tours` → **0 critical, 0 serious** (0 total). Category colour always pairs with an icon and the name — on chips, the always-present legend, the filter list, and map pins. |
| 13 | `npm audit` clean at moderate and above | **PASS** | `npm audit` → **0 vulnerabilities** (after the overrides below). |
| 14 | No placeholder copy or TODOs anywhere | **PASS** | Anti-generic audit (100/100) blocks placeholders/TODOs in `app`, `components`, `lib`; a repo grep finds none (the only "todo" hit is the Spanish word *todos*). |

## Fixes applied during the audit (nothing silent)

| Severity | File | Finding | Fix |
|----------|------|---------|-----|
| High | `package.json` | `sharp@0.34.5` (< 0.35.0) inherited libvips CVEs — a transitive optional dep of Next 15's image optimizer (unused here, no `next/image`). The `npm audit fix --force` path would install Next 16, breaking the Next 15 requirement. | Pinned `sharp` to `0.35.3` via `overrides`, keeping Next 15. |
| High | `package.json` | `postcss` ≤ 8.5.22 — build-time source-map path-traversal / XSS advisories. | Bumped the direct dep and added a `postcss` `override` to `8.5.26`. |
| Low | `package.json` | `@eslint/plugin-kit` < 0.3.4 (via eslint) — dev tooling only, below the moderate gate. | Overrode `@eslint/plugin-kit` to `0.7.2` to reach a fully clean audit. |
| Medium | `app/[locale]/book/[tourSlug]/page.tsx` | The availability surface (departures + live seat counts) had no rate limit, unlike the hold/book/booking routes. | Added a per-IP rate limit (60/min) to the availability page. |

## Verdict

Item 1 (the hard stop) passes — no overselling under concurrency. Thirteen of
fourteen pass with evidence; item 9 has a written remediation and must be run on
the deployed URL, where its accessibility half is already corroborated by a clean
axe-core pass. **Cleared to launch once the deployed-URL Lighthouse run confirms
Perf ≥ 90.**
