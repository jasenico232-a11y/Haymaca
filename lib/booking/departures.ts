import { tours } from "@/lib/tours/data";
import type { Departure } from "./types";

// Deposit percentage lives on the tour record; longer, higher-value trips take a
// larger deposit. Everything else uses the default.
const DEPOSIT_PCT: Record<string, number> = {
  "island-traverse-7day": 0.3,
  "south-coast-3day": 0.3,
};
const SEATS: Record<string, number> = {
  "island-traverse-7day": 8,
  "south-coast-3day": 8,
  "blue-mountain-peak-sunrise": 12,
};
const DEFAULT_SEATS = 14;
const DEFAULT_DEPOSIT = 0.25;

/** One departure per tour per available date. Seeded into the store at startup;
 *  in production these are rows in Supabase. */
export function seedDepartures(): Departure[] {
  const list: Departure[] = [];
  for (const tour of tours) {
    for (const date of tour.availableDates) {
      const seatsTotal = SEATS[tour.slug] ?? DEFAULT_SEATS;
      list.push({
        id: `${tour.slug}__${date}`,
        tourSlug: tour.slug,
        date,
        seatsTotal,
        seatsAvailable: seatsTotal,
        priceUsdPerPerson: tour.priceUsd,
        depositPct: DEPOSIT_PCT[tour.slug] ?? DEFAULT_DEPOSIT,
        status: "scheduled",
      });
    }
  }
  return list;
}
