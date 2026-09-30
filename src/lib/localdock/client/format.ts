"use client";

/**
 * Human-friendly formatting used across the LocalDock UI.
 *
 * Locale-aware: the i18n provider syncs the active language via
 * `setFormatterLocale()`, and every formatter picks its units, suffixes and
 * date rendering from the table below. Digits stay Latin in every language
 * (tech-context convention) — `tabular-nums` keeps them aligned.
 */

export type FormatLocale =
  | "en"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ru"
  | "zh"
  | "hi"
  | "ja";

let currentLocale: FormatLocale = "en";

export function setFormatterLocale(locale: string) {
  currentLocale = (FORMATTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as FormatLocale)
    : "en";
}

const FORMATTED_LOCALES: readonly FormatLocale[] = [
  "en",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "ru",
  "zh",
  "hi",
  "ja",
];

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
  es: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "unos segundos",
    sec: (n) => `${n} s`,
    minSec: (m, s) => `${m} min ${s} s`,
    hrMin: (h, m) => `${h} h ${m} min`,
    justNow: "justo ahora",
    aMinuteAgo: "hace un minuto",
    minutesAgo: (n) => `hace ${n} minutos`,
    anHourAgo: "hace una hora",
    hoursAgo: (n) => `hace ${n} horas`,
    yesterday: "ayer",
    daysAgo: (n) => `hace ${n} días`,
    greetings: ["Buenas noches", "Buenos días", "Buenas tardes", "Buenas noches"],
    intlTag: "es",
  },
  fr: {
    bytes: "o",
    units: ["Ko", "Mo", "Go", "To", "Po"],
    perSecond: "/s",
    zeroSpeed: "0 o/s",
    fewSeconds: "quelques secondes",
    sec: (n) => `${n} s`,
    minSec: (m, s) => `${m} min ${s} s`,
    hrMin: (h, m) => `${h} h ${m} min`,
    justNow: "à l’instant",
    aMinuteAgo: "il y a une minute",
    minutesAgo: (n) => `il y a ${n} minutes`,
    anHourAgo: "il y a une heure",
    hoursAgo: (n) => `il y a ${n} heures`,
    yesterday: "hier",
    daysAgo: (n) => `il y a ${n} jours`,
    greetings: ["Bonne nuit", "Bonjour", "Bon après-midi", "Bonsoir"],
    intlTag: "fr",
  },
  de: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "wenige Sekunden",
    sec: (n) => `${n} Sek.`,
    minSec: (m, s) => `${m} Min. ${s} Sek.`,
    hrMin: (h, m) => `${h} Std. ${m} Min.`,
    justNow: "gerade eben",
    aMinuteAgo: "vor einer Minute",
    minutesAgo: (n) => `vor ${n} Minuten`,
    anHourAgo: "vor einer Stunde",
    hoursAgo: (n) => `vor ${n} Stunden`,
    yesterday: "gestern",
    daysAgo: (n) => `vor ${n} Tagen`,
    greetings: ["Gute Nacht", "Guten Morgen", "Guten Tag", "Guten Abend"],
    intlTag: "de",
  },
  pt: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "alguns segundos",
    sec: (n) => `${n} s`,
    minSec: (m, s) => `${m} min ${s} s`,
    hrMin: (h, m) => `${h} h ${m} min`,
    justNow: "agora mesmo",
    aMinuteAgo: "há um minuto",
    minutesAgo: (n) => `há ${n} minutos`,
    anHourAgo: "há uma hora",
    hoursAgo: (n) => `há ${n} horas`,
    yesterday: "ontem",
    daysAgo: (n) => `há ${n} dias`,
    greetings: ["Boa noite", "Bom dia", "Boa tarde", "Boa noite"],
    intlTag: "pt-BR",
  },
  ru: {
    bytes: "Б",
    units: ["КБ", "МБ", "ГБ", "ТБ", "ПБ"],
    perSecond: "/с",
    zeroSpeed: "0 Б/с",
    fewSeconds: "несколько секунд",
    sec: (n) => `${n} ${ruPlural(n, "секунда", "секунды", "секунд")}`,
    minSec: (m, s) => `${m} мин ${s} с`,
    hrMin: (h, m) => `${h} ч ${m} мин`,
    justNow: "только что",
    aMinuteAgo: "минуту назад",
    minutesAgo: (n) => `${n} ${ruPlural(n, "минуту", "минуты", "минут")} назад`,
    anHourAgo: "час назад",
    hoursAgo: (n) => `${n} ${ruPlural(n, "час", "часа", "часов")} назад`,
    yesterday: "вчера",
    daysAgo: (n) => `${n} ${ruPlural(n, "день", "дня", "дней")} назад`,
    greetings: ["Доброй ночи", "Доброе утро", "Добрый день", "Добрый вечер"],
    intlTag: "ru",
  },
  zh: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "几秒",
    sec: (n) => `${n} 秒`,
    minSec: (m, s) => `${m} 分 ${s} 秒`,
    hrMin: (h, m) => `${h} 小时 ${m} 分`,
    justNow: "刚刚",
    aMinuteAgo: "1 分钟前",
    minutesAgo: (n) => `${n} 分钟前`,
    anHourAgo: "1 小时前",
    hoursAgo: (n) => `${n} 小时前`,
    yesterday: "昨天",
    daysAgo: (n) => `${n} 天前`,
    greetings: ["夜深了", "早上好", "下午好", "晚上好"],
    intlTag: "zh-CN",
  },
  hi: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "कुछ सेकंड",
    sec: (n) => `${n} सेकंड`,
    minSec: (m, s) => `${m} मिनट ${s} सेकंड`,
    hrMin: (h, m) => `${h} घंटे ${m} मिनट`,
    justNow: "अभी",
    aMinuteAgo: "1 मिनट पहले",
    minutesAgo: (n) => `${n} मिनट पहले`,
    anHourAgo: "1 घंटा पहले",
    hoursAgo: (n) => `${n} घंटे पहले`,
    yesterday: "कल",
    daysAgo: (n) => `${n} दिन पहले`,
    greetings: ["शुभ रात्रि", "सुप्रभात", "शुभ अपराह्न", "शुभ संध्या"],
    intlTag: "hi",
  },
  ja: {
    bytes: "B",
    units: ["KB", "MB", "GB", "TB", "PB"],
    perSecond: "/s",
    zeroSpeed: "0 B/s",
    fewSeconds: "数秒",
    sec: (n) => `${n} 秒`,
    minSec: (m, s) => `${m} 分 ${s} 秒`,
    hrMin: (h, m) => `${h} 時間 ${m} 分`,
    justNow: "たった今",
    aMinuteAgo: "1 分前",
    minutesAgo: (n) => `${n} 分前`,
    anHourAgo: "1 時間前",
    hoursAgo: (n) => `${n} 時間前`,
    yesterday: "昨日",
    daysAgo: (n) => `${n} 日前`,
    greetings: ["お疲れさまです", "おはようございます", "こんにちは", "こんばんは"],
    intlTag: "ja",
  },
};

/** Russian plural form picker: one / few (2–4) / many. */
function ruPlural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function s(): FormatStrings {
  return STRINGS[currentLocale] ?? STRINGS.en;
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
