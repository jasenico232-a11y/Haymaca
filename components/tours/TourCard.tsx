import Link from "next/link";
import type { TourView } from "@/lib/tours/view";
import { Locator } from "@/components/island/Locator";
import { CategoryChip } from "./CategoryChip";

/**
 * Display card. No hooks, so it renders on the server in the grid and inside the
 * client map overlay from the same source. Duration and price sit in one block:
 * a price never appears without the duration that makes it comparable. The
 * media slot shows where on the island the tour goes until photography
 * replaces it.
 */
export function TourCard({ view }: { view: TourView }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-paper transition-[border-color,box-shadow] duration-150 ease-out hover:border-ink/25 hover:shadow-[0_6px_18px_-8px_rgba(18,20,15,0.22)]">
      <Locator
        points={[{ coords: view.coords, color: view.color }]}
        label={view.locatorLabel}
        className="block aspect-[5/2] h-auto w-full border-b border-line"
      />

      <div className="flex flex-1 flex-col p-4">
        <div>
          <CategoryChip category={view.category} name={view.categoryName} />
        </div>
        <h3 className="mt-3 font-display text-lg text-ink">
          <Link
            href={view.bookHref}
            className="decoration-2 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {view.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">{view.summary}</p>
        <p className="mt-2 text-sm text-muted">
          {view.departureLabel}{" "}
          <span className="text-ink">{view.departure}</span>
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
          <div>
            <dt className="text-muted">{view.durationPrefix}</dt>
            <dd className="font-medium tabular-nums text-ink">
              {view.durationLabel}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{view.nextDatePrefix}</dt>
            <dd className="font-medium tabular-nums text-ink">
              {view.nextDateLabel}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-3">
          <p className="shrink-0 leading-tight">
            <span className="block text-sm text-muted">{view.fromLabel}</span>
            <span className="whitespace-nowrap font-display text-lg font-semibold tabular-nums text-ink">
              {view.priceLabel}
            </span>
          </p>
          <Link
            href={view.bookHref}
            data-tap="true"
            tabIndex={-1}
            aria-hidden="true"
            className="relative z-10 grow whitespace-nowrap rounded-control bg-sun px-4 text-sm font-medium text-ink transition hover:brightness-95"
          >
            {view.bookLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
