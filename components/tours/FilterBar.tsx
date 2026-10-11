"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categoryAccent, type CategorySlug } from "@/lib/tours/model";
import { CategoryIcon } from "./CategoryIcon";

type Option = { value: string; name: string };
type CategoryOption = { value: CategorySlug; name: string };

type Props = {
  categories: CategoryOption[];
  durations: Option[];
  prices: Option[];
  places: Option[];
  sorts: Option[];
  minDate: string;
  resultCount: number;
  labels: {
    heading: string;
    category: string;
    duration: string;
    price: string;
    date: string;
    clear: string;
    sort: string;
    from: string;
    toggle: string;
    activeCount: string;
    results: string;
  };
};

const FILTER_KEYS = ["category", "from", "duration", "price", "date"] as const;

export function FilterBar({
  categories,
  durations,
  prices,
  places,
  sorts,
  minDate,
  resultCount,
  labels,
}: Props) {
  const panelId = useId();
  // Closed by default below lg so the results are the first thing on a phone;
  // from lg up the panel is always shown and this state does nothing.
  const [open, setOpen] = useState(false);
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
  const activeCount = FILTER_KEYS.reduce(
    (total, key) =>
      total + (key === "date" ? (currentDate ? 1 : 0) : listFor(key).length),
    0,
  );

  const legendClass = "text-sm font-semibold text-ink";
  const optionRow = "flex cursor-pointer items-center gap-2 text-sm text-ink";
  const checkboxClass =
    "h-4 w-4 shrink-0 rounded-[3px] border-line text-forest accent-forest";

  function checkboxGroup(key: string, legend: string, options: Option[]) {
    return (
      <fieldset>
        <legend className={legendClass}>{legend}</legend>
        <ul className="mt-2 space-y-1">
          {options.map((option) => (
            <li key={option.value}>
              <label data-tap="true" className={optionRow}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={listFor(key).includes(option.value)}
                  onChange={() => toggleMulti(key, option.value)}
                />
                {option.name}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    );
  }

  return (
    <div className="rounded-card border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 lg:px-5 lg:pb-0 lg:pt-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="-ml-2 gap-2 whitespace-nowrap rounded-control px-2 font-display text-base font-semibold text-ink lg:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          >
            <path
              d="M7 4l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {labels.toggle}
          {activeCount > 0 ? (
            <span className="rounded-control bg-forest px-1.5 font-body text-xs font-medium text-paper">
              {labels.activeCount.replace("{n}", String(activeCount))}
            </span>
          ) : null}
        </button>
        <h2 className="hidden font-display text-lg font-semibold text-ink lg:block">
          {labels.heading}
        </h2>
        {anyFilter ? (
          <button
            type="button"
            onClick={clearFilters}
            className="whitespace-nowrap rounded-control px-3 text-sm font-medium text-river transition-colors hover:text-ink"
          >
            {labels.clear}
          </button>
        ) : null}
      </div>

      <div
        id={panelId}
        className={`${open ? "grid" : "hidden"} gap-6 border-t border-line p-4 sm:grid-cols-2 lg:mt-4 lg:grid lg:grid-cols-1 lg:border-t-0 lg:px-5 lg:pb-5 lg:pt-0`}
      >
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
                      className={`h-4 w-4 shrink-0 ${categoryAccent[option.value].icon}`}
                    />
                    {option.name}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {checkboxGroup("from", labels.from, places)}
        {checkboxGroup("duration", labels.duration, durations)}
        {checkboxGroup("price", labels.price, prices)}

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

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full rounded-control border border-ink px-4 text-base font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:col-span-2 lg:hidden"
        >
          {labels.results.replace("{n}", String(resultCount))}
        </button>
      </div>
    </div>
  );
}
