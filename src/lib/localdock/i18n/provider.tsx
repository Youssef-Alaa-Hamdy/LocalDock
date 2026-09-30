"use client";

/**
 * LocalDock i18n provider.
 *
 * - SSR always renders the default locale (English) for hydration safety;
 *   the saved preference is restored in a layout effect BEFORE the first
 *   paint, so Arabic users never see a flash of the wrong direction/text.
 * - A tiny blocking snippet in layout.tsx sets <html lang/dir> even earlier
 *   (pre-hydration) so CSS direction + fonts are correct from byte zero.
 */

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  dictionaries,
  detectLocale,
  isLocale,
  LANG_STORAGE_KEY,
  LOCALES,
  type Dictionary,
  type Direction,
  type Locale,
} from "./locales";
import { setFormatterLocale } from "../client/format";
import { setActiveDictionary } from "./runtime";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface I18nValue {
  locale: Locale;
  dir: Direction;
  rtl: boolean;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useIsoLayoutEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      /* private mode */
    }
    const initial = isLocale(saved) ? saved : detectLocale();
    setFormatterLocale(initial);
    setActiveDictionary(dictionaries[initial]);
    if (initial !== DEFAULT_LOCALE) {
      setLocaleState(initial);
      const html = document.documentElement;
      html.lang = initial;
      html.dir = LOCALES[initial].dir;
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    const html = document.documentElement;
    html.lang = next;
    html.dir = LOCALES[next].dir;
    setFormatterLocale(next);
    setActiveDictionary(dictionaries[next]);
  };

  // Keep the tab title localized as well.
  useEffect(() => {
    document.title = dictionaries[locale].meta.title;
  }, [locale]);

  // Keep non-React modules (transfer engine, api) on the active dictionary.
  useEffect(() => {
    setActiveDictionary(dictionaries[locale]);
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: LOCALES[locale].dir,
      rtl: LOCALES[locale].dir === "rtl",
      t: dictionaries[locale],
      setLocale,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/**
 * Isolates LTR runs (speeds, sizes, paths, IPs, codes) inside RTL text so
 * bidirectional punctuation can never scramble them.
 */
export function Ltr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
