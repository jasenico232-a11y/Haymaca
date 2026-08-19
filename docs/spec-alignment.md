# Alignment — Tours & Excursions Platform spec

This build was produced from the Tour & Excursion Platform prompt pack, so it
already matches the contract on the big things. This note records what aligns,
what was realigned in this pass, and the structural gaps that remain, with a
recommendation for each.

## Already aligned

| Spec area | Status |
|-----------|--------|
| Tokens (ink/paper/forest/river/sun/muted/line, 14–60 scale, card 6px, control 4px) | Exact |
| Display General Sans / body Inter, self-hosted via next/font | Inter real; **General Sans stand-in** (Hanken Grotesk) — Fontshare is blocked in the build env; drop-in documented in `lib/fonts/README.md` |
| i18n en/es under `app/[locale]`, middleware negotiation + cookie override | Yes |
| Security: nonce CSP (enforcing), HSTS, nosniff, Referrer-Policy, Permissions-Policy | Yes |
| 44px tap targets, phone-first | Yes |
| Catalogue: filter, sort, grid/map toggle; state in URL; server-side filtering | Yes |
| Map: MapLibre + open OSM tiles, region clustering, pin → inline card | Yes |
| Availability held server-side; hold TTL; deposit-only checkout | Yes |
| Payment provider **interface** + mock; webhook signature-verified + idempotent | Yes |
| Booking references are UUIDs; prices recomputed server-side | Yes |
| E-ticket QR carries a **signed token**, verified server-side | Yes |
| Operator manifest + scanner; weather cancellation is a status change, not a delete | Yes |
| Card data never on our servers; rate limiting; no secret in NEXT_PUBLIC_ | Yes |

## Realigned in this pass

| Rule | Before | Now |
|------|--------|-----|
| **Six named categories** (Waterfalls & Rivers, Beach & Boat, Music & Culture, Blue Mountain, Food & Rum, Private Charters) | five generic (adventure/water/culture/food/wildlife) | the six spec categories, each with its own icon + name + a **non-sun** token colour (river, sea, clay, forest, rum, marine) |
| **`sun` = calls to action only, never decorative** | primary CTAs were `forest`; `sun` used on the featured badge and step numerals | every primary CTA is now `sun` on `ink`; the featured badge is a forest outline and the numerals use `sea` |

`sun` is still used for genuine **error / warning / attention** states (form
validation, failed/expired payment, the operator's offline indicator). Those are
semantic, not decorative — there is no separate warning token in the palette. Flagged here so the choice is explicit.

axe-core stays at **0 critical / 0 serious** across EN and ES after the recolour
(ink-on-sun passes AA).

## Deployment

`vercel.json` now pins `"framework": "nextjs"`. The failed build errored with
*No Output Directory named "dist"* — the Next build itself succeeded (22 pages);
Vercel just wasn't treating the project as Next.js. If the error persists, set
**Project → Settings → Build & Development → Framework Preset = Next.js** and
clear any "Output Directory" override in the dashboard (a dashboard override can
outrank `vercel.json`).

### Important: the in-memory store will not work on serverless as-is

The spec is explicit (§ availability): *implement the hold as a database
transaction, not an in-memory map — the latter breaks the moment you run more
than one instance.* The current `BookingStore` is an in-memory singleton, built
so the whole flow is testable today. On Vercel it works **within a single warm
lambda**, but holds/bookings/manifests will not be shared across instances or
survive a cold start. The marketing pages, the catalogue, and the map deploy and
work fine; the transactional flow needs the Supabase implementation
(`docs/payments-supabase.md`) wired behind the same `BookingStore` surface before
it is production-real. Recommend: implement `SupabaseBookingStore` and select it
by env, keeping the in-memory one for tests.

## Structural gaps still open (recommendations)

1. **Home page model.** The spec's home is category tiles + featured + map; the
   current home is the enquiry-led layout from the travel-agency brief. Recommend
   rebuilding the home around the six category tiles with the map.
2. **Motion layer** (spec prompt 2): first-visit intro (category tiles stagger,
   once per session), View Transitions API route transitions, IntersectionObserver
   section reveals, Suspense skeletons, 120–180ms interaction feedback — all inside
   a 15 KB motion budget, honouring `prefers-reduced-motion`. Not yet built.
3. **Tour detail page** `tours/[slug]` with an availability calendar. Current
   `book/[tourSlug]` is a departures list; a full detail page (gallery, includes/
   excludes, meeting point, calendar) is the spec's shape.
4. **Sanity CMS** for tours/departures/content, with blur-up LQIP images and real
   colour-graded photography (currently branded SVG thumbnails).
5. **Bot protection** (Turnstile/hCaptcha) on public forms, and explicit cookie
   consent before any analytics.

None of these block the current deploy; they are the next increments toward the
full spec.
