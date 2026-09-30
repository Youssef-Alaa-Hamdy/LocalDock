"use client";

/**
 * Human-friendly formatting used across the LocalDock UI.
 *
 * Locale-aware: the i18n provider syncs the active language via
 * `setFormatterLocale()`, and every formatter picks its units, suffixes and
 * date rendering from the table below. Digits stay Latin in both languages
 * (tech-context convention) — `tabular-nums` keeps them aligned.
 */

export type FormatLocale = "en" | "ar";

let currentLocale: FormatLocale = "en";

export function setFormatterLocale(locale: string) {
  currentLocale = locale === "ar" ? "ar" : "en";
}

export function getFormatterLocale(): FormatLocale {
  return currentLocale;
}

interface FormatStrings {
  bytes: string; // B
  units: readonly [string, string, string, string, string]; // KB..PB
  perSecond: string; // /s
  zeroSpeed: string; // 0 B/s
  fewSeconds: string; // a few seconds
  sec: (n: number) => string;
  minSec: (m: number, s: number) => string;
  hrMin: (h: number, m: number) => string;
  justNow: string;
  aMinuteAgo: string;
  minutesAgo: (n: number) => string;
  anHourAgo: string;
  hoursAgo: (n: number) => string;
  yesterday: string;
  daysAgo: (n: number) => string;
  greetings: readonly [string, string, string, string]; // night, morning, afternoon, evening
  intlTag: string;
}

const STRINGS: Record<FormatLocale, FormatStrings> = {
  en: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "a few seconds",
    sec: (n) => `${n} sec`,
    minSec: (m, s) => `${m} min ${s} sec`,
    hrMin: (h, m) => `${h} hr ${m} min`,
    justNow: "just now",
    aMinuteAgo: "a minute ago",
    minutesAgo: (n) => `${n} minutes ago`,
    anHourAgo: "an hour ago",
    hoursAgo: (n) => `${n} hours ago`,
    yesterday: "yesterday",
    daysAgo: (n) => `${n} days ago`,
    greetings: ["Good night", "Good morning", "Good afternoon", "Good evening"],
    intlTag: "en-US",
  },
  ar: {
    bytes: "ب",
    units: ["ك.ب", "م.ب", "ج.ب", "ت.ب", "ب.ب"],
    perSecond: "/ث",
    zeroSpeed: "0 ب/ث",
    fewSeconds: "بضع ثوانٍ",
    sec: (n) => `${n} ث`,
    minSec: (m, s) => `${m} د ${s} ث`,
    hrMin: (h, m) => `${h} س ${m} د`,
    justNow: "الآن",
    aMinuteAgo: "قبل دقيقة",
    minutesAgo: (n) =>
      n === 2 ? "قبل دقيقتين" : n <= 10 ? `قبل ${n} دقائق` : `قبل ${n} دقيقة`,
    anHourAgo: "قبل ساعة",
    hoursAgo: (n) =>
      n === 2 ? "قبل ساعتين" : n <= 10 ? `قبل ${n} ساعات` : `قبل ${n} ساعة`,
    yesterday: "أمس",
    daysAgo: (n) =>
      n === 2 ? "قبل يومين" : n <= 10 ? `قبل ${n} أيام` : `قبل ${n} يوم`,
    greetings: ["ليلة طيبة", "صباح الخير", "طاب يومك", "مساء الخير"],
    intlTag: "ar-u-nu-latn",
  },
};

function s(): FormatStrings {
  return STRINGS[currentLocale];
}

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes)) return "—";
  const str = s();
  if (bytes < 1024) return `${bytes} ${str.bytes}`;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < str.units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : digits)} ${str.units[unit]}`;
}

export function formatSpeed(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return s().zeroSpeed;
  return `${formatBytes(bps, 1)}${s().perSecond}`;
}

export function formatEta(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return "—";
  const str = s();
  if (sec < 5) return str.fewSeconds;
  if (sec < 60) return str.sec(Math.round(sec));
  const min = Math.floor(sec / 60);
  if (min < 60) return str.minSec(min, Math.round(sec % 60));
  const hours = Math.floor(min / 60);
  return str.hrMin(hours, min % 60);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(s().intlTag, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(s().intlTag, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const str = s();
  if (diff < 45_000) return str.justNow;
  if (diff < 90_000) return str.aMinuteAgo;
  if (diff < 3_600_000) return str.minutesAgo(Math.round(diff / 60_000));
  if (diff < 7_200_000) return str.anHourAgo;
  if (diff < 86_400_000) return str.hoursAgo(Math.round(diff / 3_600_000));
  const days = Math.round(diff / 86_400_000);
  if (days === 1) return str.yesterday;
  if (days < 30) return str.daysAgo(days);
  return formatDate(ts);
}

export function greeting(): string {
  const h = new Date().getHours();
  const g = s().greetings;
  if (h < 5) return g[0];
  if (h < 12) return g[1];
  if (h < 17) return g[2];
  return g[3];
}

/** Percent helper that never divides by zero. */
export function pct(transferred: number, size: number): number {
  if (size <= 0) return transferred > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (transferred / size) * 100));
}
