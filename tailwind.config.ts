import type { Config } from "tailwindcss";

/**
 * Haymaca token layer. Every value here is a decision, not a default.
 * Components reference these names only — no raw hex, no default Tailwind
 * palette classes (bg-blue-500 and friends are banned by tools/antislop).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    // borderRadius is replaced, not extended: the brief allows exactly two radii,
    // so the default rounded-md / rounded-full utilities must not exist.
    borderRadius: {
      none: "0px",
      control: "4px", // inputs, buttons, small controls
      card: "6px", // cards, media, larger surfaces
    },
    extend: {
      colors: {
        ink: "#12140F", // near-black, primary text and inverted surfaces
        paper: "#FBFAF6", // warm off-white page background, never pure #FFF
        forest: "#1F4A34", // deep green, primary accent — the hills, not a logo blue
        river: "#2E7D8C", // muted teal, secondary accent and links
        sun: "#E8A33D", // warm amber, reserved for featured / emphasis markers
        muted: "#67675E", // secondary text
        line: "#E0DDD3", // hairlines and dividers
      },
      fontFamily: {
        // Wired to next/font CSS variables (see lib/fonts). display is the
        // wordmark/headline face; body is the reading face.
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // 14 → 60 is a 4.3× spread; the 14 and the 60 must both appear on the
        // homepage or the hierarchy is flat.
        xs: ["14px", { lineHeight: "1.5" }],
        sm: ["16px", { lineHeight: "1.55" }],
        base: ["18px", { lineHeight: "1.6" }],
        lg: ["21px", { lineHeight: "1.45" }],
        xl: ["28px", { lineHeight: "1.2" }],
        "2xl": ["40px", { lineHeight: "1.08" }],
        "3xl": ["60px", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};

export default config;
