import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function SiteFooter({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const base = `/${locale}`;
  const links = [
    { href: `${base}#destinations`, label: dict.nav.destinations },
    { href: `${base}#process`, label: dict.nav.process },
    { href: `${base}#contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="font-display text-lg font-semibold text-ink">
            {dict.brand.name}
          </span>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {dict.footer.tagline}
          </p>
          <p className="mt-2 max-w-xs text-xs text-muted">
            {dict.brand.meaning}
          </p>
        </div>

        <nav
          aria-label={dict.a11y.footerNav}
          className="flex flex-col items-start gap-1 md:col-span-4"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-tap="true"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start gap-4 md:col-span-3">
          <LocaleSwitcher
            locale={locale}
            label={dict.localeSwitcher.label}
            options={dict.localeSwitcher.options}
          />
          <a
            href="#main"
            data-tap="true"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            {dict.footer.backToTop}
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted">
          {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
