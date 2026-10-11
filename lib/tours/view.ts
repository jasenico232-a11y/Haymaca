import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  categoryColor,
  type CategorySlug,
  type RegionSlug,
  type Tour,
} from "./model";

/** A fully-localized, serializable tour ready for a card (grid or map overlay). */
export type TourView = {
  slug: string;
  category: CategorySlug;
  categoryName: string;
  region: RegionSlug;
  color: string;
  title: string;
  summary: string;
  departureLabel: string;
  departure: string;
  durationPrefix: string;
  durationLabel: string;
  fromLabel: string;
  priceLabel: string;
  nextDatePrefix: string;
  nextDateLabel: string;
  bookHref: string;
  bookLabel: string;
  coords: [number, number];
  locatorLabel: string;
};

// Fixed "today" for the seed dataset so next-available is deterministic.
const TODAY = "2026-08-19";

export function nextAvailable(tour: Tour, today: string = TODAY): string | null {
  const upcoming = tour.availableDates.find((date) => date >= today);
  return upcoming ?? tour.availableDates.at(-1) ?? null;
}

function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-GB";
}

function formatDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDuration(tour: Tour, dict: Dictionary): string {
  const unit = dict.tours.duration;
  if (tour.durationHours >= 24) {
    const days = Math.round(tour.durationHours / 24);
    return `${days} ${days === 1 ? unit.day : unit.days}`;
  }
  const hours = tour.durationHours;
  return `${hours} ${hours === 1 ? unit.hour : unit.hours}`;
}

function formatPrice(usd: number, locale: Locale): string {
  return usd.toLocaleString(locale === "es" ? "es-ES" : "en-US");
}

export function resolveTour(
  tour: Tour,
  dict: Dictionary,
  locale: Locale,
): TourView {
  const items = dict.tours.items as Record<
    string,
    { title: string; summary: string }
  >;
  const places = dict.tours.places as Record<string, string>;
  const categories = dict.tours.categories as Record<string, string>;
  const copy = items[tour.slug] ?? { title: tour.slug, summary: "" };
  const next = nextAvailable(tour);

  return {
    slug: tour.slug,
    category: tour.category,
    categoryName: categories[tour.category] ?? tour.category,
    region: tour.region,
    color: categoryColor[tour.category],
    title: copy.title,
    summary: copy.summary,
    departureLabel: dict.tours.card.departure,
    departure: places[tour.departure] ?? tour.departure,
    durationPrefix: dict.tours.card.durationLabel,
    durationLabel: formatDuration(tour, dict),
    fromLabel: dict.tours.card.from,
    priceLabel: `${dict.tours.card.currency} $${formatPrice(tour.priceUsd, locale)}`,
    nextDatePrefix: dict.tours.card.nextDate,
    nextDateLabel: next ? formatDate(next, locale) : "",
    bookHref: `/${locale}/book/${tour.slug}`,
    bookLabel: dict.tours.card.book,
    coords: tour.coords,
    locatorLabel: dict.a11y.locator.replace("{place}", copy.title),
  };
}
