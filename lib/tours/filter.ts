import { tours } from "./data";
import {
  categoryOrder,
  durationBandOf,
  durationBands,
  priceBandOf,
  placeOrder,
  priceBands,
  sortKeys,
  type CategorySlug,
  type DurationBand,
  type PlaceSlug,
  type PriceBand,
  type SortKey,
  type Tour,
  type ViewMode,
} from "./model";

export type FilterState = {
  categories: CategorySlug[];
  durations: DurationBand[];
  prices: PriceBand[];
  places: PlaceSlug[];
  date: string | null;
  sort: SortKey;
  view: ViewMode;
};

type RawParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function readList<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  const parts = (Array.isArray(value) ? value : value.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
  // Preserve canonical order and drop anything unknown or duplicated.
  return allowed.filter((option) => parts.includes(option));
}

function readOne<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const first = Array.isArray(value) ? value[0] : value;
  return first && (allowed as readonly string[]).includes(first)
    ? (first as T)
    : fallback;
}

export function parseFilters(params: RawParams): FilterState {
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;
  return {
    categories: readList(params.category, categoryOrder),
    durations: readList(params.duration, durationBands),
    prices: readList(params.price, priceBands),
    places: readList(params.from, placeOrder),
    date: rawDate && ISO_DATE.test(rawDate) ? rawDate : null,
    sort: readOne(params.sort, sortKeys, "popularity"),
    view: readOne(params.view, ["grid", "map"] as const, "grid"),
  };
}

function sortTours(list: Tour[], sort: SortKey): Tour[] {
  const copy = [...list];
  switch (sort) {
    case "price":
      copy.sort((a, b) => a.priceUsd - b.priceUsd);
      break;
    case "duration":
      copy.sort((a, b) => a.durationHours - b.durationHours);
      break;
    default:
      copy.sort((a, b) => b.popularity - a.popularity);
  }
  return copy;
}

/** Server-side: apply the URL-derived filters, then sort. */
export function filterTours(state: FilterState): Tour[] {
  const { categories, durations, prices, places, date } = state;
  const matched = tours.filter((tour) => {
    if (categories.length && !categories.includes(tour.category)) return false;
    if (durations.length && !durations.includes(durationBandOf(tour.durationHours)))
      return false;
    if (prices.length && !prices.includes(priceBandOf(tour.priceUsd)))
      return false;
    if (places.length && !places.includes(tour.departure)) return false;
    if (date && !tour.availableDates.some((available) => available >= date))
      return false;
    return true;
  });
  return sortTours(matched, state.sort);
}

/** True when any filter (not sort/view) is narrowing the results. */
export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.categories.length > 0 ||
    state.durations.length > 0 ||
    state.prices.length > 0 ||
    state.places.length > 0 ||
    state.date !== null
  );
}
