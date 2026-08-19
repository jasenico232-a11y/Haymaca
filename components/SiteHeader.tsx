import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function SiteHeader({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const base = `/${locale}`;
  const links = [
    { href: `${base}#destinations`, label: dict.nav.destinations },
    { href: `${base}/tours`, label: dict.nav.tours },
    { href: `${base}#process`, label: dict.nav.process },
    { href: `${base}#contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
        <Link href={base} data-tap="true" className="-ml-2 px-2">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            {dict.brand.name}
          </span>
        </Link>

        <nav
          aria-label={dict.a11y.primaryNav}
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-tap="true"
              className="px-3 text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher
            locale={locale}
            label={dict.localeSwitcher.label}
            options={dict.localeSwitcher.options}
          />
          <Link
            href={`${base}#enquiry`}
            data-tap="true"
            className="rounded-control bg-sun px-4 text-sm font-medium text-ink transition hover:brightness-95"
          >
            {dict.nav.enquire}
          </Link>
        </div>
      </div>
    </header>
  );
}
