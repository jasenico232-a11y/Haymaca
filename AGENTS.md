# NSE Anti-Generic Standard

Any AI agent working in this repository must follow this file. It exists to stop
the codebase drifting into the visual and verbal defaults that make a site read
as machine-generated.

Run `node audit.mjs src` before opening a PR. CI fails below the threshold in
`antislop.config.json`.

## Hard bans

Do not write, and remove on sight:

- Purple/violet/indigo → blue/cyan gradients, in any direction
- Gradient text (`bg-clip-text` + `text-transparent`)
- Glassmorphism (`backdrop-blur` over `bg-white/20`)
- Blurred background blobs (`blur-3xl` + `rounded-full`)
- Centred hero: `text-center` + `justify-center` + two side-by-side buttons
- Three-column feature grid with an icon, a two-word heading and one sentence
- Emoji used as interface iconography
- Raw Tailwind palette classes (`bg-blue-500`, `text-gray-600`). Use project tokens.
- One radius and one shadow applied to everything
- Placeholder anything: lorem ipsum, TODO, "Your Company", example@example.com

## Banned copy

Never write: seamless, elevate your, unlock the, transform your, cutting-edge,
state-of-the-art, world-class, best-in-class, game-changer, revolutionize,
empower, supercharge, holistic, bespoke solutions, one-stop shop, dive in,
embark on, journey begins, at the heart of, we believe that, in today's
fast-paced world, unparalleled.

If a sentence needs one of those words, the sentence has no content. Replace it
with a specific fact: a real place, a real number, a real duration, a real name.

## Required

- **Token layer.** At least 5 named colour tokens in the Tailwind config, and no
  raw palette classes in components. If a colour was not chosen, it was defaulted.
- **Real typefaces** via `next/font`. The system stack is the loudest signal that
  nobody designed this.
- **Explicit type scale** with a ratio of at least 3× between the largest and
  smallest sizes on a page. Flat hierarchy is the most common reason a page reads
  as generated.
- **One deliberate asymmetry** per major section. Perfect centring everywhere is
  what makes a page feel machine-made.
- **Alt text on every image.** Required, not advisory.
- **Designed empty, loading and error states.** Not inherited defaults.
- **One un-templatable detail** per project: a custom map, a real webcam, locally
  shot photography, an interaction that only makes sense for this business.

## When you cannot comply

Say so in the PR description and explain why. Do not silently ship a violation,
and do not add a rule exception without saying which rule and for what reason.
