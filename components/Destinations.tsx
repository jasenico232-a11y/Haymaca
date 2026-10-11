import type { Dictionary } from "@/i18n/dictionaries";
import { destinationCoords, destinationOrder } from "@/lib/destinations";
import { Locator } from "@/components/island/Locator";

const FOREST = "#1F4A34";

type Item =
  Dictionary["destinations"]["items"][(typeof destinationOrder)[number]];

export function Destinations({ dict }: { dict: Dictionary }) {
  const [featuredSlug, ...restSlugs] = destinationOrder;
  const featured = dict.destinations.items[featuredSlug];
  const locatorLabel = (place: string) =>
    dict.a11y.locator.replace("{place}", place);

  const facts = (item: Item, className: string) => (
    <dl className={`text-sm ${className}`}>
      <div>
        <dt className="text-muted">{dict.destinations.bestLabel}</dt>
        <dd className="font-medium text-ink">{item.best}</dd>
      </div>
      <div>
        <dt className="text-muted">{dict.destinations.fromLabel}</dt>
        <dd className="font-medium tabular-nums text-ink">{item.from}</dd>
      </div>
    </dl>
  );

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

        <ul className="mt-10 overflow-hidden rounded-card border border-line">
          <li className="grid md:grid-cols-12">
            <Locator
              points={[
                { coords: destinationCoords[featuredSlug], color: FOREST },
              ]}
              label={locatorLabel(featured.name)}
              detail
              size="lg"
              className="block h-full min-h-[200px] w-full border-b border-line md:col-span-7 md:border-b-0 md:border-r"
            />
            <div className="flex flex-col p-6 sm:p-8 md:col-span-5">
              <p className="text-sm font-medium text-forest">
                {dict.destinations.featured}
              </p>
              <h3 className="mt-1 font-display text-xl text-ink">
                {featured.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{featured.region}</p>
              <p className="mt-5 text-lg text-ink">{featured.blurb}</p>
              {facts(featured, "mt-6 flex flex-wrap gap-x-10 gap-y-2")}
            </div>
          </li>

          {restSlugs.map((slug) => {
            const item = dict.destinations.items[slug];
            return (
              <li
                key={slug}
                className="grid grid-cols-[1fr_6.5rem] gap-x-6 gap-y-3 border-t border-line p-6 sm:p-8 md:grid-cols-[6.5rem_13rem_1fr_9rem] md:items-start md:gap-x-8"
              >
                <Locator
                  points={[{ coords: destinationCoords[slug], color: FOREST }]}
                  label={locatorLabel(item.name)}
                  size="sm"
                  className="col-start-2 row-start-1 block h-auto w-full rounded-control md:col-start-1"
                />
                <div className="col-start-1 row-start-1 md:col-start-2">
                  <h3 className="font-display text-lg text-ink">{item.name}</h3>
                  <p className="mt-0.5 text-sm text-muted">{item.region}</p>
                </div>
                <p className="col-span-2 text-base text-ink md:col-span-1 md:row-start-1">
                  {item.blurb}
                </p>
                {facts(
                  item,
                  "col-span-2 flex gap-x-10 md:col-span-1 md:row-start-1 md:flex-col md:gap-y-2",
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
