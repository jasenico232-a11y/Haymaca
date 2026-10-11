# Design notes

Running memory for design work on this repo. Read it before starting; log what changed and what was learned at the end.

## 2026-10: unslop and UI upgrade

### Brief, as constrained by the build spec
Tokens, the 14 to 60 px scale, two radii and the two typefaces are pinned, so every direction below keeps them. The axes left open were concept, layout, imagery, motion and copy.

### Concept
The island is the interface: every page answers "where on Jamaica does this start?" with the real coastline before it describes anything. A competitor could not use this sentence, because their tours do not leave from Black River and Treasure Beach.

### Directions considered
1. **Restrained: polish in place.** Keep the layout, remove the generated-site tells (eyebrow, italic headline word, uppercase labels, dashes, middle dots), fix the broken bits. Safe, but leaves the home page without a reason to remember it and keeps the generic ridge-and-sun thumbnails.
2. **Bold: the island is the interface (chosen).** Natural Earth coastline as the organising device: home map of departure towns linked to a filtered catalogue, a locator in every card, destination and booking summary, a 404 pin at sea. One scroll-driven coastline trace as the only authored motion.
3. **Strange: the departure board.** Home and catalogue as a timetable of the next dated departures by town, like a ferry board. Strong for day-trippers, weak for the planned-trip enquiry that is the studio's main business. Parked: the "next date" on cards keeps a trace of it.

No direction was confirmed by the client in session; the choice is recorded here so it can be reversed.

### What shipped
- Home: hero without eyebrow or italic word, plus a link to the 13 tours; island map with five towns (list and pins share hover state through `:has()`); category index with live counts and lowest prices; destinations as a featured locator plus a ruled list; contact labels in sentence case.
- Catalogue: `from` filter (departure town), filters collapsed on phones with a "Show n" return, single-column filter panel on desktop, locator cards, price and CTA that wrap instead of squeezing, legend only in map view, designed empty state.
- Booking: back link, category chip, summary panel (locator, town, duration, price, deposit share, cancellation rule).
- 404: localized and inside the layout (catch-all route), with a pin adrift south-west of Negril.
- Browser surfaces: selection, caret, accent colour, scrollbar colour, underline offset, tabular numerals.
- Copy: every em and en dash and middle-dot string removed from UI copy, comments and docs.

### What worked
- Real geometry beats illustration: the cards now carry information the old ridge thumbnails could not.
- Starting the scroll animation from a visible island (only the stroke traces) avoided a blank box mid-scroll.

### What did not, and fixes
- Pins drifted down because they were positioned against a box that included the caption. Pins and drawing now share an inner wrapper.
- Montego Bay sits inland on the 1:10m outline (the bay is smoothed away); its pin is moved onto the drawn shore and the reason is in the code.
- Two region clusters on the phone map overlapped (WCAG 2.2 target size); crowded clusters now merge by screen distance.

### Next time
Real location photography, the tour detail page with a calendar, and the spec's motion layer are the open items in `docs/spec-alignment.md`. Do not reuse the island-as-interface direction on another client.
