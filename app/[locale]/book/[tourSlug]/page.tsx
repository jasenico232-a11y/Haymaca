import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { getBookingStore } from "@/lib/booking/store";
import { computeAmounts } from "@/lib/booking/money";
import { formatDepartureDate } from "@/lib/booking/format";
import {
  BookingForm,
  type DepartureOption,
} from "@/components/booking/BookingForm";

const MIN_DATE = "2026-08-19";

export const dynamic = "force-dynamic";

type Params = { locale: string; tourSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "en");
  return { title: dict.book.metaTitle };
}

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, tourSlug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const items = dict.tours.items as Record<
    string,
    { title: string; summary: string }
  >;
  const tour = items[tourSlug];
  if (!tour) notFound();

  const departures: DepartureOption[] = getBookingStore()
    .listDepartures()
    .filter(
      (d) => d.tourSlug === tourSlug && d.status === "scheduled" && d.date >= MIN_DATE,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      id: d.id,
      dateLabel: formatDepartureDate(d.date, locale),
      seatsAvailable: d.seatsAvailable,
      soldOut: d.seatsAvailable <= 0,
      priceCents: computeAmounts(d.priceUsdPerPerson, 1, d.depositPct).totalCents,
      depositPct: d.depositPct,
    }));

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.14em] text-river">
          {dict.book.title}
        </p>
        <h1 className="mt-3 font-display text-2xl text-ink md:text-3xl">
          {tour.title}
        </h1>
        <p className="mt-3 text-base text-muted">{tour.summary}</p>
      </header>

      {departures.length === 0 ? (
        <p className="rounded-card border border-line bg-paper p-6 text-base text-muted">
          {dict.book.noDepartures}
        </p>
      ) : (
        <BookingForm
          locale={locale}
          departures={departures}
          labels={{
            chooseDeparture: dict.book.chooseDeparture,
            seatsLeft: dict.book.seatsLeft,
            soldOut: dict.book.soldOut,
            partyLabel: dict.book.partyLabel,
            leadName: dict.book.leadName,
            leadEmail: dict.book.leadEmail,
            leadPhone: dict.book.leadPhone,
            continue: dict.book.continue,
            holding: dict.book.holding,
            depositLine: dict.book.depositLine,
            errors: dict.book.errors,
            validation: dict.book.validation,
          }}
        />
      )}
    </div>
  );
}
