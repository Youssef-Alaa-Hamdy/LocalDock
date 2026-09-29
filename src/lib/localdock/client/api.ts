"use client";

/**
 * LocalDock — client API wrapper.
 * Injects the owner key for the console and normalizes server errors into
 * friendly, actionable messages (UX rule 5: what happened, why, what to do).
 */
import type {
  ActivityEntry,
  Device,
  FileEntry,
  LocalDockSettings,
  Share,
  SystemStatus,
  UploadSessionInfo,
  Website,
} from "../types";

export interface ApiError extends Error {
  code: string;
  status: number;
  friendly: string;
}

export function makeApiError(status: number, code: string, message: string): ApiError {
  const err = new Error(message) as ApiError;
  err.code = code;
  err.status = status;
  err.friendly = message;
  return err;
}

let ownerKey: string | null = null;
export function setOwnerKey(key: string | null) {
  ownerKey = key;
}
export function getOwnerKey() {
  return ownerKey;
}

let deviceToken: string | null = null;
const DEVICE_TOKEN_KEY = "localdock.deviceToken";
export function loadDeviceToken() {
  if (typeof window === "undefined") return null;
  deviceToken = window.localStorage.getItem(DEVICE_TOKEN_KEY);
  return deviceToken;
}
export function saveDeviceToken(token: string) {
  if (typeof window === "undefined") return;
  deviceToken = token;
  window.localStorage.setItem(DEVICE_TOKEN_KEY, token);
}
export function clearDeviceToken() {
  if (typeof window === "undefined") return;
  deviceToken = null;
  window.localStorage.removeItem(DEVICE_TOKEN_KEY);
}
export function getDeviceToken() {
  return deviceToken;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { raw?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (ownerKey) headers.set("X-LocalDock-Owner", ownerKey);
  if (deviceToken) headers.set("X-LocalDock-Device", deviceToken);

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, cache: "no-store" });
  } catch {
    throw makeApiError(
      0,
      "network",
      "Can't reach your computer. Check that both devices are on the same network — transfers resume automatically when it's back."
    );
  }

  if (init?.raw) return res as unknown as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })?.error;
    throw makeApiError(
      res.status,
      err?.code ?? `http-${res.status}`,
      err?.message ?? "Something went wrong while talking to your computer."
    );
  }
  return body as T;
}

/* ---------------- typed endpoints ---------------- */

export interface BootstrapInfo {
  version: string;
  serverId: string;
  serverName: string;
  ownerKey: string;
  onboarded: boolean;
  baseUrl: string;
  /** First non-loopback LAN IPv4 — used to build QR & share links for other devices. */
  lanIp?: string | null;
  /** True under the Windows/Tauri desktop shell. */
  desktop?: boolean;
}

export const Api = {
  bootstrap: () => api<BootstrapInfo>("/api/bootstrap"),

  system: () => api<SystemStatus>("/api/system"),

  activity: (limit = 40) => api<{ activity: ActivityEntry[] }>(`/api/activity?limit=${limit}`),

  updateSettings: (patch: Partial<LocalDockSettings>) =>
    api<{ settings: LocalDockSettings }>("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),

  shares: () => api<{ shares: Share[] }>("/api/shares"),
  createShare: (input: {
    name: string;
    /** Folder inside the LocalDock home (web folder browser). */
    homeDirRel?: string;
    /** Absolute OS path from the native dialog (desktop build only). */
    absPath?: string;
    access: "read" | "readwrite";
    guestEnabled: boolean;
  }) =>
    api<{ share: Share }>("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateShare: (id: string, patch: Partial<Pick<Share, "name" | "access" | "guestEnabled" | "allowedDevices">>) =>
    api<{ share: Share }>(`/api/shares/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteShare: (id: string) =>
    api<{ ok: boolean }>(`/api/shares/${id}`, { method: "DELETE" }),

  browse: (shareId: string, path: string) =>
    api<{ path: string; entries: FileEntry[] }>(
      `/api/shares/${shareId}/browse?path=${encodeURIComponent(path)}`
    ),
  /** Cheap directory fingerprint for live-refresh polling. */
  browseSummary: (shareId: string, path: string) =>
    api<{ path: string; summary: { count: number; size: number; latest: number } }>(
      `/api/shares/${shareId}/browse?path=${encodeURIComponent(path)}&summary=1`
    ),
  search: (shareId: string, q: string, path = "") =>
    api<{ results: FileEntry[] }>(
      `/api/shares/${shareId}/search?q=${encodeURIComponent(q)}&path=${encodeURIComponent(path)}`
    ),
  createFolder: (shareId: string, path: string, name: string) =>
    api<{ ok: boolean; name: string }>(`/api/shares/${shareId}/folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name }),
    }),
  renameEntry: (shareId: string, path: string, name: string) =>
    api<{ ok: boolean }>(`/api/shares/${shareId}/entry`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name }),
    }),
  deleteEntry: (shareId: string, path: string) =>
    api<{ ok: boolean }>(
      `/api/shares/${shareId}/entry?path=${encodeURIComponent(path)}`,
      { method: "DELETE" }
    ),
  fileHash: (shareId: string, path: string) =>
    api<{ sha256: string; size: number }>(
      `/api/shares/${shareId}/hash?path=${encodeURIComponent(path)}`
    ),

  uploadInit: (input: {
    shareId: string;
    dirPath: string;
    name: string;
    size: number;
    chunkSize?: number;
    overwrite?: boolean;
    resumeUploadId?: string;
  }) =>
    api<{ uploadId: string; chunkSize: number; totalChunks: number; receivedChunks: number[]; finalName: string }>(
      "/api/upload/init",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    ),
  uploadStatus: (uploadId: string) =>
    api<{ session: UploadSessionInfo | null }>(
      `/api/upload/status?uploadId=${encodeURIComponent(uploadId)}`
    ),
  uploadComplete: (uploadId: string) =>
    api<{
      upload?: UploadSessionInfo;
      incomplete?: boolean;
      missingChunks?: number[];
    }>("/api/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    }),
  uploadCancel: (uploadId: string) =>
    api<{ ok: boolean }>("/api/upload/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    }),

  devices: () =>
    api<{ devices: (Device & { online: boolean })[] }>("/api/devices"),
  revokeDevice: (id: string) =>
    api<{ ok: boolean }>(`/api/devices/${id}`, { method: "DELETE" }),

  pairStart: () =>
    api<{
      code: string;
      expiresAt: number;
      claimUrl: string;
      qrUrl: string;
    }>("/api/pair/start", { method: "POST" }),
  pairClaim: (input: { code: string; deviceName: string; platform: string }) =>
    api<{
      device: { id: string; name: string; pairedAt: number };
      deviceToken: string;
      server: { serverId: string; serverName: string; baseUrl: string };
      shares: { id: string; name: string; slug: string; access: string }[];
    }>("/api/pair/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  websites: () => api<{ websites: Website[] }>("/api/websites"),
  hostWebsite: (input: { name: string; homeDirRel?: string; absPath?: string; slug?: string }) =>
    api<{ website: Website }>("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateWebsite: (id: string, patch: { name?: string; enabled?: boolean }) =>
    api<{ website: Website }>(`/api/websites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteWebsite: (id: string) =>
    api<{ ok: boolean }>(`/api/websites/${id}`, { method: "DELETE" }),

  fsBrowse: (path: string, mode: "shares" | "websites") =>
    api<{
      cwd: string;
      parent?: string | null;
      base?: string;
      hasIndexHtml?: boolean;
      dirs: { name: string; path: string; kind?: "drive" | "shortcut" | "dir" }[];
    }>(`/api/fs/browse?mode=${mode}&path=${encodeURIComponent(path)}`),
  fsCreate: (path: string, name: string, mode: "shares" | "websites") =>
    api<{ ok: boolean; path: string; name: string }>("/api/fs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name, mode }),
    }),

  guestShare: (slug: string) =>
    api<{
      share: { id: string; name: string; slug: string; access: string; guestEnabled: boolean };
    }>(`/api/guest/${encodeURIComponent(slug)}`),
};
