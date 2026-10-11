# Alignment: Tours and Excursions Platform spec

This build was produced from the Tour & Excursion Platform prompt pack, so it
already matches the contract on the big things. This note records what aligns,
what was realigned in this pass, and the structural gaps that remain, with a
recommendation for each.

## Already aligned

| Spec area | Status |
|-----------|--------|
| Tokens (ink/paper/forest/river/sun/muted/line, 14 to 60 scale, card 6px, control 4px) | Exact |
| Display General Sans / body Inter, self-hosted via next/font | Inter real; **General Sans stand-in** (Hanken Grotesk): Fontshare is blocked in the build env; drop-in documented in `lib/fonts/README.md` |
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
semantic, not decorative, and there is no separate warning token in the palette. Flagged here so the choice is explicit.

axe-core stays at **0 critical / 0 serious** across EN and ES after the recolour
(ink-on-sun passes AA).

## Deployment

`vercel.json` now pins `"framework": "nextjs"`. The failed build errored with
*No Output Directory named "dist"*. The Next build itself succeeded (22 pages);
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

## Closed in the unslop and UI pass (2026-10)

- **Home page model.** The home now carries the spec's catalogue entry points
  under the enquiry-led hero: an island map of the five departure towns (each
  links to `/tours?from=<town>`) and an index of the six categories with live
  counts and lowest prices (each links to `/tours?category=<slug>`). The
  catalogue gained a matching "Leaving from" filter.
- **Motion, partly.** One scroll-driven moment (the coastline trace and pin
  drop on the home map), zero JavaScript, reduced-motion safe. The rest of the
  spec's motion layer is still open, below.
- **Designed states.** Localized 404 inside the layout, catalogue empty state,
  mobile filter disclosure with a "Show n" return.

## Structural gaps still open (recommendations)

1. **Motion layer** (spec prompt 2): first-visit intro, View Transitions API
   route transitions, Suspense skeletons and 120 to 180ms interaction feedback,
   inside a 15 KB budget, honouring `prefers-reduced-motion`. Keep the coastline
   trace as the one orchestrated moment; add transitions, not more reveals.
2. **Tour detail page** `tours/[slug]` with an availability calendar. The
   booking page now has a summary panel (locator, town, duration, price, deposit
   share, cancellation rule), which is the right column of that page already.
3. **Sanity CMS** for tours, departures and content, with blur-up LQIP images
   and real colour-graded location photography. When photos land, keep the
   locator as a small inset on each card rather than dropping it.
4. **Bot protection** (Turnstile or hCaptcha) on public forms, and explicit
   cookie consent before any analytics.

None of these block the current deploy; they are the next increments toward the
full spec.
