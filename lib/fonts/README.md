# Fonts

Both faces are self-hosted and loaded with `next/font/local` (see `index.ts`).
No font is requested from a third-party CDN at runtime.

| Role    | Shipped file                         | Family         | Licence            |
| ------- | ------------------------------------ | -------------- | ------------------ |
| Body    | `Inter-latin-var*.woff2`             | Inter          | SIL OFL 1.1        |
| Display | `HankenGrotesk-latin-var*.woff2`     | Hanken Grotesk | SIL OFL 1.1        |

Each file is a variable font (weight axis `100 900`), latin subset; it covers
English and Spanish, including `á é í ó ú ñ ¿ ¡`.

## Display face: General Sans vs. the shipped stand-in

The brief specifies **General Sans** (Fontshare, ITF Free Font License) for the
display role. Its binaries could not be downloaded in the build environment
because outbound requests to Fontshare are blocked by network policy. Rather
than ship a broken build or a bare system stack, the display slot ships
**Hanken Grotesk**, an open grotesque with close metrics, as a documented
stand-in.

### Swapping in the real General Sans

1. Download General Sans from https://www.fontshare.com/fonts/general-sans and
   place the variable woff2 files here, e.g. `GeneralSans-Variable.woff2` and
   `GeneralSans-Variable-Italic.woff2`.
2. Point the `displayFont` `src` paths in `index.ts` at those files.

The Tailwind token (`font-display` → `var(--font-display)`) and every usage in
components stay exactly the same, so this is the only change required.
