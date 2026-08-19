/**
 * Tour catalogue model: the language-neutral facts and the category system.
 * Localized copy (titles, summaries, place and category names) lives in the
 * message catalogues; nothing here is user-facing text.
 */

export type CategorySlug =
  | "waterfalls"
  | "beach-boat"
  | "music-culture"
  | "blue-mountain"
  | "food-rum"
  | "charters";

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
  "waterfalls",
  "beach-boat",
  "music-culture",
  "blue-mountain",
  "food-rum",
  "charters",
];

/** Hex per category, for the map (paint expressions need real colours). Kept in
 *  sync with the Tailwind tokens in tailwind.config.ts. None use sun — that is
 *  reserved for calls to action. */
export const categoryColor: Record<CategorySlug, string> = {
  waterfalls: "#2E7D8C", // river
  "beach-boat": "#3F93B3", // sea
  "music-culture": "#B4552E", // clay
  "blue-mountain": "#1F4A34", // forest
  "food-rum": "#8A5A2B", // rum
  charters: "#3C5A6B", // marine
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
  waterfalls: { icon: "text-river", chip: "border-river/30 bg-river/5" },
  "beach-boat": { icon: "text-sea", chip: "border-sea/30 bg-sea/5" },
  "music-culture": { icon: "text-clay", chip: "border-clay/30 bg-clay/5" },
  "blue-mountain": { icon: "text-forest", chip: "border-forest/30 bg-forest/5" },
  "food-rum": { icon: "text-rum", chip: "border-rum/30 bg-rum/5" },
  charters: { icon: "text-marine", chip: "border-marine/30 bg-marine/5" },
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
