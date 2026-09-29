/**
 * LocalDock — server-side transfer throughput metrics.
 * A sliding window over (timestamp, bytes) events gives the live
 * "current transfer speed" shown on the dashboard, computed from
 * real upload chunk + download traffic.
 */

interface Event {
  at: number;
  bytes: number;
}

const WINDOW_MS = 3000;
const events: Event[] = [];
let totalBytes = 0;

export function recordBytes(bytes: number): void {
  if (bytes <= 0) return;
  const now = Date.now();
  events.push({ at: now, bytes });
  totalBytes += bytes;
  // trim while we are here (cheap, keeps memory bounded)
  while (events.length > 0 && now - events[0].at > WINDOW_MS * 4) {
    events.shift();
  }
}

export function currentSpeedBps(): number {
  const now = Date.now();
  let bytes = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    if (now - events[i].at <= WINDOW_MS) bytes += events[i].bytes;
    else break;
  }
  return Math.round((bytes * 1000) / WINDOW_MS);
}

export function totalTransferredBytes(): number {
  return totalBytes;
}
