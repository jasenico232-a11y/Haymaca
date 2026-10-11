/**
 * Locale configuration. Adding a locale means adding it here and dropping a
 * matching catalogue in i18n/messages; nothing in the components hardcodes a
 * language.
 */
export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie the middleware and the language switcher use to persist an override. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}
