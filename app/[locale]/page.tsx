import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { IslandMap } from "@/components/island/IslandMap";
import { Kinds } from "@/components/Kinds";
import { Destinations } from "@/components/Destinations";
import { Process } from "@/components/Process";
import { Contact } from "@/components/Contact";
import { placeCoords } from "@/lib/tours/model";
import { summarizeByPlace } from "@/lib/tours/summary";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.tours;
  const number = locale === "es" ? "es-ES" : "en-US";

  const towns = summarizeByPlace().map((group) => ({
    place: group.place,
    name: t.places[group.place],
    coords: placeCoords[group.place],
    href: `/${locale}/tours?from=${group.place}`,
    countLabel: (group.count === 1 ? t.resultOne : t.resultOther).replace(
      "{n}",
      String(group.count),
    ),
    fromLabel: dict.island.from.replace(
      "{price}",
      group.fromUsd.toLocaleString(number),
    ),
    categories: group.categories.map((slug) => ({
      slug,
      name: t.categories[slug],
    })),
  }));

  return (
    <>
      <Hero dict={dict} locale={locale} />
      <IslandMap
        towns={towns}
        title={dict.island.title}
        intro={dict.island.intro}
        mapLabel={dict.a11y.islandMap.replace(
          "{towns}",
          towns.map((town) => town.name).join(", "),
        )}
        credit={dict.island.credit}
      />
      <Kinds dict={dict} locale={locale} />
      <Destinations dict={dict} />
      <Process dict={dict} />
      <Contact dict={dict} />
    </>
  );
}
