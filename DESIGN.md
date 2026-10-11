---
name: Haymaca
description: Jamaica trips and tours, organised around the island's real coastline.
colors:
  ink: "#12140F"
  paper: "#FBFAF6"
  forest: "#1F4A34"
  river: "#2E7D8C"
  sun: "#E8A33D"
  muted: "#67675E"
  line: "#E0DDD3"
  clay: "#B4552E"
  sea: "#3F93B3"
  rum: "#8A5A2B"
  marine: "#3C5A6B"
typography:
  display:
    fontFamily: "General Sans (Hanken Grotesk stand-in), ui-sans-serif, sans-serif"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "General Sans (Hanken Grotesk stand-in), ui-sans-serif, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.08
  body:
    fontFamily: "Inter, ui-sans-serif, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Inter, ui-sans-serif, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  control: "4px"
  card: "6px"
spacing:
  gutter: "20px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  toggle-active:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "44px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
---

# Design System: Haymaca

## Overview

The island is the interface. Haymaca's competitors show the same beach photo; Haymaca shows where things are. The real coastline of Jamaica (Natural Earth data, one shared projection) appears at three sizes: the home page map of departure towns, a locator in every tour card and destination, and the booking summary. The 404 puts a pin out at sea. Everything else stays quiet so the geography carries the identity: warm paper ground, ink type, forest for land and selection, sun only on the button that moves you forward.

## Colors

### Primary
- **sun `#E8A33D`**: calls to action only (book, enquire, continue). Never a badge, a highlight or a selection colour. Also used for form error borders, the one semantic exception, documented in `docs/spec-alignment.md`.

### Secondary
- **forest `#1F4A34`**: active toggles, the island's land tint (9%) and coastline, link underlines, the featured label.
- **river `#2E7D8C`**: focus ring and secondary links.

### Category accents
river (Waterfalls and Rivers), sea (Beach and Boat), clay (Music and Culture), forest (Blue Mountain), rum (Food and Rum), marine (Private Charters). A category colour always travels with its icon and its written name.

### Neutral
ink text and the dark Process band, paper ground (never pure white), muted secondary text, line hairlines.

### Named Rules
- **Sun moves you forward.** If a sun element does not submit, book or open WhatsApp, it is wrong.
- **Selection is sea at 28%**, not sun.

## Typography

Display: General Sans (Hanken Grotesk ships as a stand-in until the Fontshare files are added; see `lib/fonts/README.md`). Body: Inter. The scale is pinned: 14, 16, 18, 21, 28, 40, 60 px.

### Hierarchy
- Hero headline: 40 px on phones, 60 px from 640 px up, semibold, held to 14ch so it breaks into four short lines.
- Section headings: 40 px regular. Card and row titles: 21 px. Body: 18 px. Labels and meta: 14 to 16 px, sentence case.
- Prices, durations and dates use tabular numerals.

### Named Rules
- **No eyebrows.** No uppercase tracked labels above headings or in data labels.
- **No single italic word** in a headline. Emphasis comes from size and weight.

## Layout

`max-w-6xl` container with a 20 px gutter. Every major section breaks symmetry once: the hero splits 7/5 with the enquiry form on the right; the island map overhangs the container on the right at 1280 px and up; the category index sits in the right 7 columns; destinations pair a large featured locator with a ruled list. Section rhythm alternates between wide drawings, ruled lists and the dark Process band.

## Elevation & Depth

Flat by default, separated by `line` hairlines. Only two shadows: the enquiry form (`shadow-sm`) and a tour card on hover (`0 6px 18px -8px` ink at 22%). No coloured glows.

## Shapes

Two radii only: 4 px for controls, 6 px for cards and media. Tailwind's default `rounded-*` scale is removed. Pins are drawn as SVG circles, not CSS radius.

## Components

### Buttons
Sun background, ink label, 44 px tall, `hover:brightness-95`. Labels say what happens: "Book this tour", "Continue on WhatsApp", "Hold seats and continue".

### Chips
Category chip: tinted border and wash in the category colour, icon in the colour, name in ink.

### Cards / Containers
Tour card: locator strip (5:2) on top, chip, title (the real link, stretched over the card), summary, departure town, duration and next date, then price and a sun CTA that wraps to full width when the card is narrow.

### Inputs / Fields
44 px minimum, 4 px radius, line border, river border on focus, sun border when invalid. Caret and checkbox accent are forest.

### Navigation
Sticky header on paper. Below 640 px the language switch shows EN and ES so "Plan a trip" stays on one line. Catalogue filters collapse behind "Filter and sort" below 1024 px, with a "Show n" button to return to results.

### Island map (signature)
`components/island/IslandMap.tsx` and `Locator.tsx`, geometry in `lib/geo/jamaica.ts`. The town list and the pins are one control: hovering or focusing a row lifts its pin through CSS `:has()`, no JavaScript. Labels sit over the sea, placed per town. Montego Bay's pin is moved onto the drawn shore because the 1:10m outline smooths over its bay.

## Do's and Don'ts

### Do:
- Answer "where does it start?" with the coastline before any description.
- Keep the one authored motion: the coastline trace and pin drop, scroll-driven, with a finished drawing for reduced motion and older browsers.
- Write numbers as numbers: 2,256 metres, 15 minutes, USD 60.

### Don't:
- Don't add stock photography to fill a media slot. Wait for real location photography, then keep the locator as an inset.
- Don't use sun decoratively, add eyebrows, number non-sequences, or join metadata with middle dots.
- Don't add a second motion effect to sections; one moment per page.
