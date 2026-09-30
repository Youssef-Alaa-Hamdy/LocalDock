"use client";

/**
 * LocalDock theme packs.
 *
 * next-themes owns light/dark/system (the `.dark` class). A theme pack is an
 * orthogonal hue identity stored as `data-theme` on <html>; every pack ships
 * a complete light + dark variable set in globals.css, so all
 * mode × pack combinations (4 × 2) are first-class citizens.
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
import { useTheme } from "next-themes";

export type ThemePack = "teal" | "ocean" | "amethyst" | "sunset";

export const THEME_PACK_KEY = "localdock.themePack";
export const DEFAULT_PACK: ThemePack = "teal";

export interface ThemePackMeta {
  id: ThemePack;
  /** Swatch gradient (CSS colors) used by the settings picker. */
  swatch: [string, string, string];
  /** Fallback <meta name="theme-color"> per resolved mode. */
  chrome: { light: string; dark: string };
}

export const THEME_PACKS: Record<ThemePack, ThemePackMeta> = {
  teal: {
    id: "teal",
    swatch: ["#0F766E", "#14B8A6", "#99F6E4"],
    chrome: { light: "#F6F7F9", dark: "#0A0E14" },
  },
  ocean: {
    id: "ocean",
    swatch: ["#1D4ED8", "#3B82F6", "#BFDBFE"],
    chrome: { light: "#F5F7FB", dark: "#0A0D15" },
  },
  amethyst: {
    id: "amethyst",
    swatch: ["#7E22CE", "#A855F7", "#E9D5FF"],
    chrome: { light: "#F7F6FA", dark: "#0D0B14" },
  },
  sunset: {
    id: "sunset",
    swatch: ["#B45309", "#F59E0B", "#FDE68A"],
    chrome: { light: "#FAF7F2", dark: "#14100A" },
  },
};

export const THEME_PACK_LIST = Object.keys(THEME_PACKS) as ThemePack[];

export function isThemePack(value: unknown): value is ThemePack {
  return typeof value === "string" && value in THEME_PACKS;
}

interface ThemePackValue {
  pack: ThemePack;
  setPack: (pack: ThemePack) => void;
}

const ThemePackContext = createContext<ThemePackValue | null>(null);

function applyPackDom(pack: ThemePack) {
  const html = document.documentElement;
  if (pack === DEFAULT_PACK) html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", pack);
}

export function ThemePackProvider({ children }: { children: ReactNode }) {
  const [pack, setPackState] = useState<ThemePack>(DEFAULT_PACK);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(THEME_PACK_KEY);
    } catch {
      /* private mode */
    }
    const initial = isThemePack(saved) ? saved : DEFAULT_PACK;
    setPackState(initial);
    applyPackDom(initial);
  }, []);

  const setPack = (next: ThemePack) => {
    setPackState(next);
    try {
      window.localStorage.setItem(THEME_PACK_KEY, next);
    } catch {
      /* private mode */
    }
    applyPackDom(next);
  };

  // Keep the browser chrome color in lock-step with mode × pack.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = THEME_PACKS[pack].chrome;
    const color =
      resolvedTheme === "dark" ? meta.dark : meta.light;
    const tags = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    tags.forEach((tag, i) => {
      if (i === 0) {
        tag.media = "";
        tag.setAttribute("content", color);
      } else {
        tag.remove();
      }
    });
  }, [pack, resolvedTheme]);

  const value = useMemo<ThemePackValue>(() => ({ pack, setPack }), [pack]);

  return (
    <ThemePackContext.Provider value={value}>
      {children}
    </ThemePackContext.Provider>
  );
}

export function useThemePack(): ThemePackValue {
  const ctx = useContext(ThemePackContext);
  if (!ctx)
    throw new Error("useThemePack must be used inside <ThemePackProvider>");
  return ctx;
}
