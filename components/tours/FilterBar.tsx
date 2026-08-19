"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categoryAccent, type CategorySlug } from "@/lib/tours/model";
import { CategoryIcon } from "./CategoryIcon";

type Option = { value: string; name: string };
type CategoryOption = { value: CategorySlug; name: string };

type Props = {
  categories: CategoryOption[];
  durations: Option[];
  prices: Option[];
  sorts: Option[];
  minDate: string;
  labels: {
    heading: string;
    category: string;
    duration: string;
    price: string;
    date: string;
    clear: string;
    sort: string;
  };
};

const FILTER_KEYS = ["category", "duration", "price", "date"] as const;

export function FilterBar({
  categories,
  durations,
  prices,
  sorts,
  minDate,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function commit(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function listFor(key: string): string[] {
    return (searchParams.get(key) ?? "").split(",").filter(Boolean);
  }

  function toggleMulti(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = listFor(key);
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    commit(params);
  }

  function setDate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("date", value);
    else params.delete("date");
    commit(params);
  }

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "popularity") params.set("sort", value);
    else params.delete("sort");
    commit(params);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);
    commit(params);
  }

  const currentSort = searchParams.get("sort") ?? "popularity";
  const currentDate = searchParams.get("date") ?? "";
  const anyFilter = FILTER_KEYS.some((key) => searchParams.get(key));

  const legendClass = "text-sm font-semibold text-ink";
  const optionRow =
    "flex cursor-pointer items-center gap-2 text-sm text-ink";
  const checkboxClass =
    "h-4 w-4 shrink-0 rounded-[3px] border-line text-forest accent-forest";

  return (
    <div className="rounded-card border border-line bg-paper p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          {labels.heading}
        </h2>
        {anyFilter ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-control px-3 text-sm font-medium text-river transition-colors hover:text-ink"
          >
            {labels.clear}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <fieldset>
          <legend className={legendClass}>{labels.category}</legend>
          <ul className="mt-2 space-y-1">
            {categories.map((option) => {
              const checked = listFor("category").includes(option.value);
              return (
                <li key={option.value}>
                  <label data-tap="true" className={optionRow}>
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={checked}
                      onChange={() => toggleMulti("category", option.value)}
                    />
                    <CategoryIcon
                      category={option.value}
                      className={`h-4 w-4 ${categoryAccent[option.value].icon}`}
                    />
                    {option.name}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset>
          <legend className={legendClass}>{labels.duration}</legend>
          <ul className="mt-2 space-y-1">
            {durations.map((option) => (
              <li key={option.value}>
                <label data-tap="true" className={optionRow}>
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={listFor("duration").includes(option.value)}
                    onChange={() => toggleMulti("duration", option.value)}
                  />
                  {option.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className={legendClass}>{labels.price}</legend>
          <ul className="mt-2 space-y-1">
            {prices.map((option) => (
              <li key={option.value}>
                <label data-tap="true" className={optionRow}>
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={listFor("price").includes(option.value)}
                    onChange={() => toggleMulti("price", option.value)}
                  />
                  {option.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="filter-date" className={legendClass}>
              {labels.date}
            </label>
            <input
              id="filter-date"
              type="date"
              min={minDate}
              value={currentDate}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river"
            />
          </div>

          <div>
            <label htmlFor="filter-sort" className={legendClass}>
              {labels.sort}
            </label>
            <select
              id="filter-sort"
              value={currentSort}
              onChange={(event) => setSort(event.target.value)}
              className="mt-2 w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river"
            >
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
