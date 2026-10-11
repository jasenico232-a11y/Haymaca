import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { categoryAccent } from "@/lib/tours/model";
import { summarizeByCategory } from "@/lib/tours/summary";
import { CategoryIcon } from "@/components/tours/CategoryIcon";

/**
 * The six tour categories as an index rather than a tile wall: each row is a
 * filtered catalogue link with a live count and the lowest price, read from
 * the same data the catalogue uses so the numbers cannot drift.
 */
export function Kinds({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const groups = summarizeByCategory();
  const t = dict.tours;
  const price = (usd: number) =>
    dict.island.from.replace(
      "{price}",
      usd.toLocaleString(locale === "es" ? "es-ES" : "en-US"),
    );

  return (
    <section id="kinds" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-4">
          <h2 className="font-display text-2xl text-ink md:text-[40px]">
            {dict.kinds.title}
          </h2>
          <p className="mt-4 max-w-sm text-base text-muted">
            {dict.kinds.intro}
          </p>
        </div>

        <ul className="grid gap-x-10 md:col-span-8 md:col-start-5 md:grid-cols-2 lg:col-span-7 lg:col-start-6">
          {groups.map((group) => {
            const count = (
              group.count === 1 ? t.resultOne : t.resultOther
            ).replace("{n}", String(group.count));
            return (
              <li key={group.category} className="border-t border-line">
                <Link
                  href={`/${locale}/tours?category=${group.category}`}
                  className="group grid grid-cols-[3rem_1fr] items-center gap-4 py-5"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-control text-paper transition-transform duration-150 ease-out group-hover:-rotate-3 ${categoryAccent[group.category].solid}`}
                  >
                    <CategoryIcon
                      category={group.category}
                      className="h-6 w-6"
                    />
                  </span>
                  <span>
                    <span className="block font-display text-lg text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-colors group-hover:decoration-ink">
                      {t.categories[group.category]}
                    </span>
                    <span className="block text-sm tabular-nums text-muted">
                      {count}, {price(group.fromUsd)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
