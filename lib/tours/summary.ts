import { tours } from "./data";
import {
  categoryOrder,
  placeOrder,
  type CategorySlug,
  type PlaceSlug,
} from "./model";

export type GroupSummary = {
  count: number;
  /** Lowest per-person price in the group, USD. */
  fromUsd: number;
  /** Categories present, in canonical order. */
  categories: CategorySlug[];
};

function summarize(list: typeof tours): GroupSummary {
  return {
    count: list.length,
    fromUsd: Math.min(...list.map((tour) => tour.priceUsd)),
    categories: categoryOrder.filter((category) =>
      list.some((tour) => tour.category === category),
    ),
  };
}

/** Per departure town, west to east. Towns with no tours are left out. */
export function summarizeByPlace(): Array<{ place: PlaceSlug } & GroupSummary> {
  return placeOrder
    .map((place) => ({
      place,
      ...summarize(tours.filter((tour) => tour.departure === place)),
    }))
    .filter((group) => group.count > 0);
}

/** Per category, in canonical order. Empty categories are left out. */
export function summarizeByCategory(): Array<
  { category: CategorySlug } & GroupSummary
> {
  return categoryOrder
    .map((category) => ({
      category,
      ...summarize(tours.filter((tour) => tour.category === category)),
    }))
    .filter((group) => group.count > 0);
}

export const tourCount = tours.length;
