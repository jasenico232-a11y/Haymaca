"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

type Props = {
  locale: Locale;
  label: string;
  options: Record<Locale, string>;
};

/**
 * Explicit language override. Writes the NEXT_LOCALE cookie the middleware reads,
 * then swaps the locale segment of the current path.
 */
export function LocaleSwitcher({ locale, label, options }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(target: Locale) {
    if (target === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;

    const segments = pathname.split("/");
    // segments[0] is "", segments[1] is the current locale prefix.
    segments[1] = target;
    router.push(segments.join("/") || `/${target}`);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-control border border-line"
    >
      {locales.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => switchTo(option)}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "px-3 text-sm font-medium text-paper bg-forest"
                : "px-3 text-sm text-muted transition-colors hover:text-ink"
            }
          >
            {options[option]}
          </button>
        );
      })}
    </div>
  );
}
