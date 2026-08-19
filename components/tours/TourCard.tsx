import Link from "next/link";
import type { TourView } from "@/lib/tours/view";
import { CategoryChip } from "./CategoryChip";
import { TourThumb } from "./TourThumb";

/**
 * Display card. No hooks, so it renders on the server in the grid and inside the
 * client map overlay from the same source. Duration and price sit in one block:
 * a price never appears without the duration that makes it comparable.
 */
export function TourCard({ view }: { view: TourView }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-paper">
      <div className="aspect-[4/3] border-b border-line">
        <TourThumb
          title={view.title}
          color={view.color}
          seed={view.slug}
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div>
          <CategoryChip category={view.category} name={view.categoryName} />
        </div>
        <h3 className="mt-3 font-display text-lg text-ink">{view.title}</h3>
        <p className="mt-1 text-sm text-muted">{view.summary}</p>
        <p className="mt-2 text-sm text-muted">
          {view.departureLabel}{" "}
          <span className="text-ink">{view.departure}</span>
        </p>

        <dl className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">
              {view.durationPrefix}
            </dt>
            <dd className="text-base font-medium text-ink">
              {view.durationLabel}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-xs uppercase tracking-wide text-muted">
              {view.fromLabel}
            </dt>
            <dd className="font-display text-lg font-semibold text-ink">
              {view.priceLabel}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted">
          {view.nextDatePrefix}:{" "}
          <span className="font-medium text-ink">{view.nextDateLabel}</span>
        </p>

        <Link
          href={view.bookHref}
          data-tap="true"
          className="mt-4 w-full rounded-control bg-sun px-4 text-sm font-medium text-ink transition hover:brightness-95"
        >
          {view.bookLabel}
        </Link>
      </div>
    </article>
  );
}
