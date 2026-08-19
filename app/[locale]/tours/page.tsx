import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import {
  categoryOrder,
  durationBands,
  priceBands,
  sortKeys,
} from "@/lib/tours/model";
import { filterTours, parseFilters } from "@/lib/tours/filter";
import { resolveTour } from "@/lib/tours/view";
import { FilterBar } from "@/components/tours/FilterBar";
import { ViewToggle } from "@/components/tours/ViewToggle";
import { CategoryLegend } from "@/components/tours/CategoryLegend";
import { TourGrid } from "@/components/tours/TourGrid";
import { TourMapLoader } from "@/components/tours/TourMapLoader";

type LocaleParams = { locale: string };
type Search = { [key: string]: string | string[] | undefined };

const MIN_DATE = "2026-08-19";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "en");
  return {
    title: dict.tours.meta.title,
    description: dict.tours.meta.description,
    alternates: {
      canonical: `/${locale}/tours`,
      languages: { en: "/en/tours", es: "/es/tours" },
    },
  };
}

export default async function ToursPage({
  params,
  searchParams,
}: {
  params: Promise<LocaleParams>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.tours;

  const state = parseFilters(await searchParams);
  const views = filterTours(state).map((tour) => resolveTour(tour, dict, locale));

  const categoryOptions = categoryOrder.map((value) => ({
    value,
    name: t.categories[value],
  }));
  const durationOptions = durationBands.map((value) => ({
    value,
    name: t.durationBands[value],
  }));
  const priceOptions = priceBands.map((value) => ({
    value,
    name: t.priceBands[value],
  }));
  const sortOptions = sortKeys.map((value) => ({ value, name: t.sort[value] }));

  const count = views.length;
  const countLabel = (count === 1 ? t.resultOne : t.resultOther).replace(
    "{n}",
    String(count),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-2xl text-ink md:text-3xl">{t.title}</h1>
        <p className="mt-4 text-base text-muted">{t.intro}</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <FilterBar
            categories={categoryOptions}
            durations={durationOptions}
            prices={priceOptions}
            sorts={sortOptions}
            minDate={MIN_DATE}
            labels={{
              heading: t.filters.heading,
              category: t.filters.category,
              duration: t.filters.duration,
              price: t.filters.price,
              date: t.filters.date,
              clear: t.filters.clear,
              sort: t.filters.sort,
            }}
          />
        </aside>

        <section className="lg:col-span-8 xl:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted" aria-live="polite">
              {countLabel}
            </p>
            <ViewToggle labels={t.view} />
          </div>

          <div className="mt-5">
            <CategoryLegend dict={dict} />
          </div>

          <div className="mt-6">
            {count === 0 ? (
              <div className="rounded-card border border-line bg-paper p-8 text-center">
                <h2 className="font-display text-xl text-ink">{t.empty.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-base text-muted">
                  {t.empty.body}
                </p>
                <Link
                  href={`/${locale}/tours`}
                  data-tap="true"
                  className="mt-6 inline-flex rounded-control bg-forest px-5 text-base font-medium text-paper transition-colors hover:bg-ink"
                >
                  {t.empty.action}
                </Link>
              </div>
            ) : state.view === "map" ? (
              <TourMapLoader
                tours={views}
                labels={{
                  loading: t.map.loading,
                  close: t.map.close,
                  clusterTemplate: t.map.clusterTemplate,
                  regionsLabel: t.map.regionsLabel,
                }}
              />
            ) : (
              <TourGrid views={views} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
