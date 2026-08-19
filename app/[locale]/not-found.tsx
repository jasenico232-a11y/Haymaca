import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";

export default async function NotFound() {
  // not-found renders without route params; recover the locale from the cookie
  // the middleware set, falling back to the default.
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-start px-5 py-24 md:py-32">
      <p className="font-display text-3xl font-semibold text-sun">
        {dict.notFound.code}
      </p>
      <h1 className="mt-4 font-display text-2xl text-ink md:text-[40px]">
        {dict.notFound.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-muted">{dict.notFound.body}</p>
      <Link
        href={`/${locale}`}
        data-tap="true"
        className="mt-8 rounded-control bg-forest px-5 text-base font-medium text-paper transition-colors hover:bg-ink"
      >
        {dict.notFound.home}
      </Link>
    </section>
  );
}
