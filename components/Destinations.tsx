import type { Dictionary } from "@/i18n/dictionaries";
import { destinationOrder } from "@/lib/destinations";

export function Destinations({ dict }: { dict: Dictionary }) {
  return (
    <section id="destinations" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-12">
          <h2 className="font-display text-2xl text-ink md:col-span-5 md:text-[40px]">
            {dict.destinations.title}
          </h2>
          <p className="max-w-xl text-base text-muted md:col-span-6 md:col-start-7">
            {dict.destinations.intro}
          </p>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2">
          {destinationOrder.map((slug, index) => {
            const item = dict.destinations.items[slug];
            const featured = index === 0;
            return (
              <li
                key={slug}
                className={
                  featured
                    ? "bg-paper p-6 sm:p-8 md:col-span-2"
                    : "bg-paper p-6 sm:p-8"
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl text-ink">{item.name}</h3>
                  {featured ? (
                    <span className="rounded-control border border-forest/40 bg-forest/5 px-2 py-1 text-xs font-medium uppercase tracking-wide text-forest">
                      {dict.destinations.featured}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{item.region}</p>
                <p
                  className={
                    featured
                      ? "mt-4 max-w-2xl text-lg text-ink"
                      : "mt-4 text-base text-ink"
                  }
                >
                  {item.blurb}
                </p>
                <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">{dict.destinations.bestLabel}</dt>
                    <dd className="font-medium text-ink">{item.best}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{dict.destinations.fromLabel}</dt>
                    <dd className="font-medium text-ink">{item.from}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
