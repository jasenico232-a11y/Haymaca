import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { Locator } from "@/components/island/Locator";

// A pin out in the Caribbean, south-west of Negril: the page that drifted off
// the map, next to a coastline that is exactly where it should be.
const ADRIFT: [number, number] = [-78.16, 17.9];

export default async function NotFound() {
  // not-found renders without route params; recover the locale from the cookie
  // the middleware set, falling back to the default.
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-12 md:py-28">
      <div className="md:col-span-5">
        <p className="font-display text-3xl font-semibold tabular-nums text-forest">
          {dict.notFound.code}
        </p>
        <h1 className="mt-4 font-display text-2xl text-ink">
          {dict.notFound.title}
        </h1>
        <p className="mt-4 max-w-md text-base text-muted">
          {dict.notFound.body}
        </p>
        <Link
          href={`/${locale}`}
          data-tap="true"
          className="mt-8 rounded-control bg-sun px-5 text-base font-medium text-ink transition hover:brightness-95"
        >
          {dict.notFound.home}
        </Link>
      </div>
      <Locator
        points={[{ coords: ADRIFT, color: "#3F93B3" }]}
        detail
        size="lg"
        className="block h-auto w-full rounded-card md:col-span-7"
      />
    </section>
  );
}
