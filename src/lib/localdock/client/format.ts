"use client";

/** Human-friendly formatting used across the LocalDock UI. */

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : digits)} ${units[unit]}`;
}

export function formatSpeed(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return "0 B/s";
  return `${formatBytes(bps, 1)}/s`;
}

export function formatEta(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return "—";
  if (sec < 5) return "a few seconds";
  if (sec < 60) return `${Math.round(sec)} sec`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ${Math.round(sec % 60)} sec`;
  const hours = Math.floor(min / 60);
  return `${hours} hr ${min % 60} min`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 45_000) return "just now";
  if (diff < 90_000) return "a minute ago";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} minutes ago`;
  if (diff < 7_200_000) return "an hour ago";
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} hours ago`;
  const days = Math.round(diff / 86_400_000);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(ts);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Percent helper that never divides by zero. */
export function pct(transferred: number, size: number): number {
  if (size <= 0) return transferred > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (transferred / size) * 100));
}
