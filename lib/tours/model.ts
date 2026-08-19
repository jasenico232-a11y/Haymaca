/**
 * Tour catalogue model: the language-neutral facts and the category system.
 * Localized copy (titles, summaries, place and category names) lives in the
 * message catalogues; nothing here is user-facing text.
 */

export type CategorySlug =
  | "adventure"
  | "water"
  | "culture"
  | "food"
  | "wildlife";

export type RegionSlug =
  | "south-coast"
  | "portland"
  | "blue-mountains"
  | "kingston"
  | "cockpit"
  | "st-ann";

export type PlaceSlug =
  | "kingston"
  | "port-antonio"
  | "treasure-beach"
  | "black-river"
  | "montego-bay";

export type DurationBand = "half-day" | "full-day" | "multi-day";
export type PriceBand = "under-100" | "100-250" | "250-500" | "over-500";
export type SortKey = "popularity" | "price" | "duration";
export type ViewMode = "grid" | "map";

export type Tour = {
  slug: string;
  category: CategorySlug;
  region: RegionSlug;
  departure: PlaceSlug;
  durationHours: number;
  priceUsd: number;
  /** 0–100, editorial ranking used for the popularity sort. */
  popularity: number;
  /** [longitude, latitude]. */
  coords: [number, number];
  /** Future departure dates, ISO yyyy-mm-dd, ascending. */
  availableDates: string[];
};

export const categoryOrder: CategorySlug[] = [
  "adventure",
  "water",
  "culture",
  "food",
  "wildlife",
];

/** Hex per category, for the map (paint expressions need real colours). Kept in
 *  sync with the Tailwind tokens of the same name in tailwind.config.ts. */
export const categoryColor: Record<CategorySlug, string> = {
  adventure: "#1F4A34", // forest
  water: "#2E7D8C", // river
  culture: "#B4552E", // clay
  food: "#E8A33D", // sun
  wildlife: "#6B7B3A", // moss
};

/**
 * Literal Tailwind classes per category — the name is always ink for contrast,
 * the category colour rides on the icon and a tint, so colour never stands
 * alone. Written out in full so Tailwind's scanner keeps them.
 */
export const categoryAccent: Record<
  CategorySlug,
  { icon: string; chip: string }
> = {
  adventure: { icon: "text-forest", chip: "border-forest/30 bg-forest/5" },
  water: { icon: "text-river", chip: "border-river/30 bg-river/5" },
  culture: { icon: "text-clay", chip: "border-clay/30 bg-clay/5" },
  food: { icon: "text-sun", chip: "border-sun/50 bg-sun/10" },
  wildlife: { icon: "text-moss", chip: "border-moss/30 bg-moss/5" },
};

export const durationBands: DurationBand[] = [
  "half-day",
  "full-day",
  "multi-day",
];
export const priceBands: PriceBand[] = [
  "under-100",
  "100-250",
  "250-500",
  "over-500",
];
export const sortKeys: SortKey[] = ["popularity", "price", "duration"];

export function durationBandOf(hours: number): DurationBand {
  if (hours <= 5) return "half-day";
  if (hours < 24) return "full-day";
  return "multi-day";
}

export function priceBandOf(usd: number): PriceBand {
  if (usd < 100) return "under-100";
  if (usd < 250) return "100-250";
  if (usd < 500) return "250-500";
  return "over-500";
}

/** Jamaica, framed for the whole island. */
export const jamaicaBounds: [[number, number], [number, number]] = [
  [-78.6, 17.6],
  [-76.0, 18.6],
];
