"use client";

/**
 * LocalDock i18n — locale registry.
 *
 * Adding a new language is a two-file affair:
 *   1. create `src/lib/localdock/i18n/<code>.ts` exporting a dictionary typed
 *      as `SameShape<typeof en>` (the compiler enforces 100% key coverage);
 *   2. register it in `dictionaries` below.
 * Everything else — switcher UI, RTL, fonts, formatting — picks it up
 * automatically.
 */

import { en } from "./en";
import { ar } from "./ar";

export type Direction = "ltr" | "rtl";

export interface LocaleMeta {
  /** BCP-47 code — also used for <html lang>, Intl and font selection. */
  code: string;
  /** English name (shown as secondary label in the switcher). */
  name: string;
  /** Native name — always shown in the language's own script. */
  nativeName: string;
  dir: Direction;
}

export const dictionaries = { en, ar } as const;

export type Locale = keyof typeof dictionaries;
/**
 * The runtime dictionary type — literal string types of the `en` object are
 * widened so every locale dictionary (and the `en` value itself) is
 * assignable to it.
 */
export type Dictionary = SameShape<typeof en>;
/** A translated dictionary must match the English shape exactly. */
export type SameShape<T> = T extends (...args: infer A) => string
  ? (...args: A) => string
  : T extends string
    ? string
    : { [K in keyof T]: SameShape<T[K]> };

export const LOCALES: Record<Locale, LocaleMeta> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
  },
};

export const LOCALE_LIST = Object.keys(LOCALES) as Locale[];
export const DEFAULT_LOCALE: Locale = "en";

export const LANG_STORAGE_KEY = "localdock.lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && value in dictionaries;
}

/** Browser language sniffing used only when the user has no saved preference. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    const base = (l ?? "").toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export { en, ar };
