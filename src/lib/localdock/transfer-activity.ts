/**
 * LocalDock — cross-device live transfer activity (server side, in-memory).
 *
 * Every upload (tracked natively by the upload engine) and every client-side
 * download (reported via /api/shares/[id]/transfer-report) is registered here.
 * The `?summary=1` browse poll piggybacks the active entries so every open
 * device sees the same live "who is transferring what" picture.
 *
 * In-memory only by design: activity is ephemeral state that loses meaning
 * after a restart. Stale entries (device went offline mid-transfer) are
 * garbage-collected on access.
 */
import type { AuthContext, TransferActivity } from "./types";

const ACTIVE_TTL_MS = 20_000; // no heartbeat for 20s -> device probably offline
const DONE_TTL_MS = 90_000; // finished transfers linger briefly as confirmation
const MAX_PER_SHARE = 60;

const store = new Map<string, Map<string, TransferActivity>>();

function bucket(shareId: string): Map<string, TransferActivity> {
  let b = store.get(shareId);
  if (!b) {
    b = new Map();
    store.set(shareId, b);
  }
  return b;
}

function gc(b: Map<string, TransferActivity>, now: number) {
  for (const [id, a] of b) {
    const ttl = a.status === "active" ? ACTIVE_TTL_MS : DONE_TTL_MS;
    if (now - a.updatedAt > ttl) b.delete(id);
  }
  // hard cap — drop oldest finished first
  if (b.size > MAX_PER_SHARE) {
    const entries = [...b.values()]
      .sort((x, y) => x.updatedAt - y.updatedAt)
      .slice(0, b.size - MAX_PER_SHARE);
    for (const e of entries) b.delete(e.id);
  }
}

/** Human label for the device doing the transfer. */
export function deviceLabel(auth: AuthContext): string {
  if (auth.kind === "device" && auth.device) return auth.device.name;
  if (auth.kind === "owner") return "Owner console";
  return "Guest";
}

export function deviceClientId(auth: AuthContext): string {
  if (auth.kind === "device" && auth.device) return `device:${auth.device.id}`;
  if (auth.kind === "owner") return "owner";
  return "guest";
}

/* ---------- uploads (hooked from the upload engine routes) ---------- */

export function trackUploadStart(input: {
  uploadId: string;
  shareId: string;
  dirPath: string;
  name: string;
  size: number;
  auth: AuthContext;
}) {
  const now = Date.now();
  bucket(input.shareId).set(input.uploadId, {
    id: input.uploadId,
    shareId: input.shareId,
    kind: "upload",
    name: input.name,
    size: Math.max(0, input.size),
    transferred: 0,
    device: deviceLabel(input.auth),
    clientId: deviceClientId(input.auth),
    dirPath: input.dirPath || "",
    startedAt: now,
    updatedAt: now,
    status: "active",
  });
}

/** Cheap per-chunk progress update (called from the chunk route). */
export function trackUploadProgress(
  uploadId: string,
  shareId: string,
  receivedChunks: number,
  chunkSize: number
) {
  const a = bucket(shareId).get(uploadId);
  if (!a) return;
  a.transferred = Math.min(a.size, receivedChunks * chunkSize);
  a.updatedAt = Date.now();
}

export function trackUploadDone(
  uploadId: string,
  shareId: string,
  status: "done" | "failed" | "canceled",
  finalName?: string
) {
  const a = bucket(shareId).get(uploadId);
  if (!a) return;
  if (finalName) a.name = finalName;
  if (status === "done") a.transferred = a.size;
  a.status = status;
  a.updatedAt = Date.now();
}

/* ---------- downloads (reported by the client transfer engine) ---------- */

export function trackDownloadReport(input: {
  shareId: string;
  key: string;
  name: string;
  size: number;
  transferred: number;
  clientId: string;
  device: string;
  status: "active" | "done" | "failed" | "canceled";
}) {
  const b = bucket(input.shareId);
  const now = Date.now();
  const existing = b.get(input.key);
  b.set(input.key, {
    id: input.key,
    shareId: input.shareId,
    kind: "download",
    name: input.name,
    size: Math.max(0, input.size),
    transferred: Math.max(0, input.transferred),
    device: input.device,
    clientId: input.clientId,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    status: input.status,
  });
  gc(b, now);
}

/* ---------- reads ---------- */

/**
 * Active (and very recently finished) transfers for a share — returned to
 * every polling client. Entries the requesting device itself created are
 * still included; the client filters by clientId so it can also show its own
 * background transfers consistently.
 */
export function activeForShare(shareId: string): TransferActivity[] {
  const b = store.get(shareId);
  if (!b) return [];
  gc(b, Date.now());
  return [...b.values()].sort((x, y) => y.startedAt - x.startedAt);
}
