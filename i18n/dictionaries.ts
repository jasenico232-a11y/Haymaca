import type { Locale } from "./config";
import en from "./messages/en.json";
import es from "./messages/es.json";

/**
 * The English catalogue is the source of truth for the message shape. Typing the
 * registry as Record<Locale, Dictionary> makes TypeScript reject any catalogue
 * that drifts out of parity — a missing key in es fails the build.
 */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
