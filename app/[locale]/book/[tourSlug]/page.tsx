import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { getBookingStore } from "@/lib/booking/store";
import { computeAmounts } from "@/lib/booking/money";
import { formatDepartureDate } from "@/lib/booking/format";
import { rateLimit } from "@/lib/rate-limit";
import { tours } from "@/lib/tours/data";
import { categoryColor } from "@/lib/tours/model";
import { resolveTour } from "@/lib/tours/view";
import { Locator } from "@/components/island/Locator";
import { CategoryChip } from "@/components/tours/CategoryChip";
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

  // Availability is served here (departures plus live seat counts), so it is
  // rate-limited.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`availability:${ip}`, 60, 60_000).ok) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-base text-muted">{dict.book.status.rateLimited}</p>
      </div>
    );
  }

  const items = dict.tours.items as Record<
    string,
    { title: string; summary: string }
  >;
  const tour = items[tourSlug];
  const record = tours.find((entry) => entry.slug === tourSlug);
  if (!tour || !record) notFound();
  const view = resolveTour(record, dict, locale);

  const departures: DepartureOption[] = getBookingStore()
    .listDepartures()
    .filter(
      (d) =>
        d.tourSlug === tourSlug &&
        d.status === "scheduled" &&
        d.date >= MIN_DATE,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      id: d.id,
      dateLabel: formatDepartureDate(d.date, locale),
      seatsAvailable: d.seatsAvailable,
      soldOut: d.seatsAvailable <= 0,
      priceCents: computeAmounts(d.priceUsdPerPerson, 1, d.depositPct)
        .totalCents,
      depositPct: d.depositPct,
    }));

  const depositPct = Math.round((departures[0]?.depositPct ?? 0) * 100);
  const summary = dict.book.summary;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <Link
        href={`/${locale}/tours`}
        className="-ml-1 inline-flex items-center gap-1.5 px-1 text-sm text-muted underline decoration-line decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
          <path
            d="M12 4l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {dict.book.backToTours}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <header className="mb-8">
            <CategoryChip category={view.category} name={view.categoryName} />
            <h1 className="mt-4 font-display text-2xl text-ink md:text-3xl">
              {tour.title}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted">{tour.summary}</p>
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
                departureOption: dict.book.departureOption,
                soldOut: dict.book.soldOut,
                partyLabel: dict.book.partyLabel,
                leadName: dict.book.leadName,
                leadEmail: dict.book.leadEmail,
                leadPhone: dict.book.leadPhone,
                continue: dict.book.continue,
                holding: dict.book.holding,
                requirements: dict.book.requirements,
                requirementsHint: dict.book.requirementsHint,
                depositLine: dict.book.depositLine,
                errors: dict.book.errors,
                validation: dict.book.validation,
              }}
            />
          )}
        </div>

        <aside className="lg:col-span-5 lg:pt-14">
          <div className="overflow-hidden rounded-card border border-line lg:sticky lg:top-24">
            <Locator
              points={[
                {
                  coords: record.coords,
                  color: categoryColor[record.category],
                },
              ]}
              label={view.locatorLabel}
              detail
              size="lg"
              className="block h-auto w-full border-b border-line"
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 pb-4 text-sm sm:p-6 sm:pb-4">
              <div>
                <dt className="text-muted">{summary.leavesFrom}</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {view.departure}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{summary.duration}</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-ink">
                  {view.durationLabel}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{summary.perPerson}</dt>
                <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-ink">
                  {view.priceLabel}
                </dd>
              </div>
              {depositPct > 0 ? (
                <div>
                  <dt className="text-muted">{summary.deposit}</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-ink">
                    {summary.depositValue.replace("{pct}", String(depositPct))}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mx-5 border-t border-line py-4 text-sm text-muted sm:mx-6">
              {dict.book.status.cancelWithin}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
