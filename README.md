# Haymaca

Enquiry-led travel site for Jamaica, built on Next.js 15. A Kingston studio that
answers trip enquiries by hand. The site's job is to earn that first message,
not to run a checkout. _Haymaca_ is the island's Taíno name, "land of wood and
water."

This repository is the **scaffold**: the design-token layer, bilingual routing
(English / Spanish), the security-header middleware, and a real, content-complete
home page. There are no stub pages and no hardcoded UI copy.

## Stack

| Layer      | Choice                                                    |
| ---------- | -------------------------------------------------------- |
| Framework  | Next.js 15, App Router, React Server Components           |
| Language   | TypeScript, `strict` (plus `noUncheckedIndexedAccess`)   |
| Styling    | Tailwind CSS v3 with a project token layer               |
| Fonts      | `next/font/local`, self-hosted woff2 (no font CDN)       |
| i18n       | Custom middleware negotiation + JSON message catalogues  |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 → redirects to /en or /es
```

| Script               | Does                                             |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Dev server                                       |
| `npm run build`      | Production build                                  |
| `npm run start`      | Serve the production build                        |
| `npm run typecheck`  | `tsc --noEmit`                                     |
| `npm run lint`       | ESLint (`next/core-web-vitals` + `next/typescript`)|
| `npm run audit:slop` | Anti-generic audit over `app/` and `components/`   |

## Design tokens

Defined once in [`tailwind.config.ts`](./tailwind.config.ts) and referenced by
name everywhere: no raw hex, no default Tailwind palette classes in components.

- **Colour:** `ink #12140F`, `paper #FBFAF6`, `forest #1F4A34`,
  `river #2E7D8C`, `sun #E8A33D`, `muted #67675E`, `line #E0DDD3`
- **Type scale:** 14 / 16 / 18 / 21 / 28 / 40 / 60 px (`text-xs` to `text-3xl`).
  The 60 and the 14 both appear on the homepage; that spread is the hierarchy.
- **Radius:** `card` 6px, `control` 4px. The default `rounded-*` utilities are
  removed so only these two exist.
- **Fonts:** `font-display` and `font-body`, wired to the self-hosted faces.

## Internationalisation

- Locales live under `app/[locale]/`; `en` and `es` are prerendered.
- [`middleware.ts`](./middleware.ts) negotiates the locale on any un-prefixed
  path: an explicit `NEXT_LOCALE` cookie wins, otherwise the `Accept-Language`
  header (by quality), otherwise the default. The language switcher writes that
  cookie, so a choice sticks.
- Every visible string comes from [`i18n/messages/en.json`](./i18n/messages/en.json)
  / [`es.json`](./i18n/messages/es.json). The English catalogue is the source of
  truth for the message shape, and TypeScript rejects any Spanish key that drifts
  out of parity.

## Security headers

All set in `middleware.ts`, one source of truth:

- **Content-Security-Policy** with a fresh per-request nonce. `script-src` is
  `'self' 'nonce-…' 'strict-dynamic'`, with no `unsafe-inline` for scripts. The nonce
  is forwarded to the render so Next.js stamps it onto every script tag; it
  rotates each request and matches the response header.
- **Strict-Transport-Security:** two years, `includeSubDomains; preload`.
- **X-Content-Type-Options** `nosniff`, **Referrer-Policy**
  `strict-origin-when-cross-origin`, a restrictive **Permissions-Policy**, and
  **X-Frame-Options** `DENY`.

## Accessibility

- Every interactive element presents at least a **44×44px** tap target, set as a
  base-layer rule in [`app/globals.css`](./app/globals.css) (WCAG 2.5.8).
- Visible keyboard focus, a skip link, `prefers-reduced-motion` honoured, and
  labelled form controls.

## Keeping it from looking machine-generated

The [anti-generic audit](./tools/antislop) (`npm run audit:slop`) fails the build
on the patterns that read as AI-generated: banned copy, gradient text,
glassmorphism, raw palette classes, a centred hero, the default three-column
feature grid, missing token or font layers. The rules live in
[`AGENTS.md`](./AGENTS.md); current score is 100/100.

## The display typeface: please read

The brief specifies **General Sans** (Fontshare, ITF Free Font License) for the
display role. Its binaries could not be fetched in the build environment because
outbound requests to Fontshare are blocked by network policy, and it is not
mirrored on Google Fonts or npm. The display slot therefore ships **Hanken
Grotesk**, an open (SIL OFL) grotesque with close metrics, as a documented,
drop-in stand-in. Swapping in the real General Sans is a two-file change with no
component edits; see [`lib/fonts/README.md`](./lib/fonts/README.md).
