import localFont from "next/font/local";

/**
 * Self-hosted type, loaded through next/font/local. No third-party font CDN is
 * on the critical path: the woff2 files ship from our own origin.
 *
 * Body: Inter (variable, latin subset: covers en and es diacritics and ¿¡).
 *
 * Display: the brief specifies General Sans (Fontshare, ITF Free Font License).
 * Its binaries could not be fetched in this build environment (egress policy
 * blocks Fontshare), so the committed display files are Hanken Grotesk, an
 * open (SIL OFL) grotesque with close metrics, used as a drop-in stand-in.
 * To ship the specified face: replace the two GeneralSans* files below with the
 * real General Sans woff2 and update the `src` paths. Nothing else changes:
 * the token is `--font-display` everywhere. See lib/fonts/README.md.
 */

export const bodyFont = localFont({
  variable: "--font-body",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  src: [
    {
      path: "./Inter-latin-var.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./Inter-latin-var-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
});

export const displayFont = localFont({
  variable: "--font-display",
  display: "swap",
  // A serif-free grotesque, so the fallback is a sans stack, never a serif.
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  src: [
    {
      path: "./HankenGrotesk-latin-var.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./HankenGrotesk-latin-var-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
});
