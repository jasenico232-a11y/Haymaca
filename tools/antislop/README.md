# NSE Anti-Generic Audit

A linter for the patterns that make a website look AI-generated.

```bash
node audit.mjs src              # human-readable report
node audit.mjs src --json       # machine-readable, for CI
node audit.mjs src --config=./custom.json
```

Exits `1` when the score falls below `failScore` in `antislop.config.json`.

## What it checks

| Category | Examples |
|---|---|
| Copy | 40+ banned phrases, hedge words, placeholder text |
| Visual | purple-blue gradients, gradient text, glassmorphism, blobs, emoji icons |
| Palette | raw Tailwind colour classes used instead of project tokens |
| Uniformity | one radius / one shadow repeated across the whole codebase |
| Layout | centred hero, default three-column feature grid |
| Structure | missing token layer, no custom fonts, no type scale |
| Accessibility | images without alt text |

## Scoring

Starts at 100. Critical −12, high −6, medium −2.5, low −1. Default pass mark 60.

Validated against two fixtures: a deliberately generic component set scores 0,
a deliberately designed one scores 100.

## Wiring into CI

```yaml
- name: Anti-generic audit
  run: node tools/antislop/audit.mjs src
```

## Honest limits

This catches **patterns, not taste**. A page can pass every rule here and still be
boring. It cannot tell you whether the photography is good, whether the copy is
true, or whether the layout serves the content. Use it as a floor, not a ceiling —
then look at the thing with your own eyes.

Tune `antislop.config.json` per project. Do not delete rules to make a build pass.
