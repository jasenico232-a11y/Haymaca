import Link from "next/link";
import {
  COASTLINE_DETAIL,
  ISLAND_HEIGHT,
  ISLAND_VIEWBOX,
  ISLAND_WIDTH,
  project,
} from "@/lib/geo/jamaica";
import {
  categoryAccent,
  type CategorySlug,
  type PlaceSlug,
} from "@/lib/tours/model";
import { CategoryIcon } from "@/components/tours/CategoryIcon";

export type Town = {
  place: PlaceSlug;
  name: string;
  coords: [number, number];
  href: string;
  countLabel: string;
  fromLabel: string;
  categories: Array<{ slug: CategorySlug; name: string }>;
};

// Where each label sits relative to its pin, chosen so no label crosses the
// coastline: north-coast towns label out over the sea, the south-west pair
// split (Black River inland, Treasure Beach out to sea) because they are only
// 17 km apart, and Kingston labels inland clear of the Palisadoes.
const LABEL_SIDE: Record<PlaceSlug, string> = {
  "montego-bay": "bottom-[30px] left-1/2 -translate-x-1/2",
  "black-river": "left-[30px] top-1/2 -translate-y-1/2",
  "treasure-beach": "top-[34px] left-1/2 -translate-x-1/2",
  kingston: "left-[30px] top-1/2 -translate-y-1/2",
  "port-antonio": "bottom-[34px] left-1/2 -translate-x-1/2",
};

// The 1:10m coastline smooths over Montego Bay's bay, which leaves the true
// town centre 5 km inland on this drawing. Its pin is moved onto the drawn
// shore; every other town sits on the coast at its real coordinates.
const DRAWN_SHORE: Partial<Record<PlaceSlug, [number, number]>> = {
  "montego-bay": [-77.892, 18.506],
};

/**
 * The home page's signature: the island at its real shape with every
 * departure town on it. The pins and the list below are one control; hovering
 * or focusing a town in the list lifts its pin (CSS :has, see globals.css), so
 * the geography answers "which of these is near my hotel?" without a map
 * library or a byte of JavaScript.
 */
export function IslandMap({
  towns,
  title,
  intro,
  mapLabel,
  credit,
}: {
  towns: Town[];
  title: string;
  intro: string;
  mapLabel: string;
  credit: string;
}) {
  return (
    <section
      id="island"
      className="scroll-mt-16 overflow-x-clip border-b border-line"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24" data-island="">
        <div className="grid gap-6 md:grid-cols-12">
          <h2 className="font-display text-2xl text-ink md:col-span-6 md:text-[40px]">
            {title}
          </h2>
          <p className="max-w-xl text-base text-muted md:col-span-5 md:col-start-8 md:pt-2">
            {intro}
          </p>
        </div>

        <figure className="island-frame mt-12 xl:-mr-16">
          <div className="relative">
            <svg
              viewBox={ISLAND_VIEWBOX}
              role="img"
              aria-label={mapLabel}
              className="block h-auto w-full"
            >
              <path
                d={COASTLINE_DETAIL}
                pathLength={1}
                className="island-coast"
                fill="#1F4A34"
                fillOpacity="0.09"
                stroke="#1F4A34"
                strokeOpacity="0.7"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>

            {towns.map((town) => {
              const [x, y] = project(DRAWN_SHORE[town.place] ?? town.coords);
              return (
                <Link
                  key={town.place}
                  href={town.href}
                  data-pin={town.place}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="island-pin group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{
                    left: `${(x / ISLAND_WIDTH) * 100}%`,
                    top: `${(y / ISLAND_HEIGHT) * 100}%`,
                  }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="pin-dot h-5 w-5 overflow-visible drop-shadow-[0_1px_1px_rgba(18,20,15,0.3)] transition-transform duration-150 ease-out"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="7"
                      fill="#12140F"
                      stroke="#FBFAF6"
                      strokeWidth="3"
                    />
                  </svg>
                  <span
                    className={`pin-label absolute whitespace-nowrap font-display text-xs font-medium leading-none text-ink sm:text-sm ${LABEL_SIDE[town.place]}`}
                  >
                    {town.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <figcaption className="mt-2 text-right text-xs text-muted xl:mr-16">
            {credit}
          </figcaption>
        </figure>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {towns.map((town) => (
            <li key={town.place} data-town={town.place} className="bg-paper">
              <Link
                href={town.href}
                className="group flex h-full flex-col gap-1 p-5 transition-colors duration-150 hover:bg-forest/5"
              >
                <span className="font-display text-lg text-ink underline decoration-line decoration-2 underline-offset-4 transition-colors group-hover:decoration-forest">
                  {town.name}
                </span>
                <span className="text-sm text-muted">
                  <span className="tabular-nums">{town.countLabel}</span>
                  {", "}
                  <span className="tabular-nums">{town.fromLabel}</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {town.categories.map((category) => (
                    <span
                      key={category.slug}
                      title={category.name}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-control border ${categoryAccent[category.slug].chip}`}
                    >
                      <CategoryIcon
                        category={category.slug}
                        className={`h-4 w-4 ${categoryAccent[category.slug].icon}`}
                      />
                      <span className="sr-only">{category.name}</span>
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
