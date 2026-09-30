"use client";

/**
 * LocalDock — client-side thumbnail fallbacks.
 *
 * The server generates thumbnails with sharp (images) and ffmpeg (videos),
 * but neither binary is guaranteed to exist on every host (standalone builds,
 * Windows bundles…). When the server answers 404 the client no longer gives
 * up — it renders the thumbnail itself:
 *
 *  - Images : load the full file through the file API and let the browser
 *             downscale it. On a LAN the transfer is cheap and instant.
 *  - Videos : grab one frame with a hidden <video> + <canvas> using the
 *             browser's own codecs — no server tooling required.
 *
 * Successful URLs, generated frames AND "server can't do it" markers are all
 * memoised, so folder re-renders never re-request known misses.
 */

import { mediaSrc, thumbSrc } from "./media";

/* ---------------- tiny LRU ---------------- */

function lruGet<T>(map: Map<string, T>, key: string, max: number): T | undefined {
  const v = map.get(key);
  if (v !== undefined) {
    map.delete(key);
    map.set(key, v); // refresh recency
  }
  return v;
}

function lruSet<T>(map: Map<string, T>, key: string, value: T, max: number) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

/* ---------------- image URLs ---------------- */

const MAX_URL_ENTRIES = 512;
const MAX_MISS_ENTRIES = 1024;
const urlCache = new Map<string, string>();
const serverMisses = new Set<string>(); // "server thumbnail generation failed" markers

/**
 * Fast path: the server-side (sharp) thumbnail URL.
 * Returns "miss" immediately for paths that already 404'd before, so the
 * component goes straight to its client-side fallback without a request.
 */
export async function serverThumb(
  shareId: string,
  relPath: string,
  size = 480
): Promise<{ kind: "url"; url: string } | { kind: "miss" }> {
  const key = `${shareId}|${relPath}|${size}`;
  if (serverMisses.has(key)) return { kind: "miss" };
  const hit = lruGet(urlCache, key, MAX_URL_ENTRIES);
  if (hit) return { kind: "url", url: hit };
  try {
    const url = await thumbSrc(shareId, relPath, size);
    lruSet(urlCache, key, url, MAX_URL_ENTRIES);
    return { kind: "url", url };
  } catch {
    return { kind: "miss" };
  }
}

/** Remember that the server cannot thumbnail this path (404 / 5xx / offline). */
export function markServerMiss(shareId: string, relPath: string, size = 480) {
  if (serverMisses.size >= MAX_MISS_ENTRIES) serverMisses.clear();
  serverMisses.add(`${shareId}|${relPath}|${size}`);
}

/** Last-resort image source: the original file (browser downscales). */
export async function fullImageSrc(shareId: string, relPath: string): Promise<string> {
  const key = `${shareId}|${relPath}|full`;
  const hit = lruGet(urlCache, key, MAX_URL_ENTRIES);
  if (hit) return hit;
  const url = await mediaSrc(shareId, relPath);
  lruSet(urlCache, key, url, MAX_URL_ENTRIES);
  return url;
}

/* ---------------- videos (client frame grab) ---------------- */

const FRAME_W = 480;
const MAX_FRAMES = 160;
const GRAB_TIMEOUT_MS = 9_000;
const MAX_CONCURRENT_GRABS = 2;

const frameCache = new Map<string, string>(); // shareId|rel -> dataURL
const inflight = new Map<string, Promise<string | null>>();

let activeGrabs = 0;
const waiters: (() => void)[] = [];

async function withGrabSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (activeGrabs >= MAX_CONCURRENT_GRABS) {
    await new Promise<void>((r) => waiters.push(r));
  }
  activeGrabs++;
  try {
    return await fn();
  } finally {
    activeGrabs--;
    waiters.shift()?.();
  }
}

export function cachedVideoFrame(shareId: string, relPath: string): string | undefined {
  return lruGet(frameCache, `${shareId}|${relPath}`, MAX_FRAMES);
}

/**
 * Capture one representative frame (~10% in) with the browser's own video
 * decoder. Works for every codec the browser can play (mp4/webm/mov…);
 * resolves null for exotic codecs or missing files.
 */
export function grabVideoFrame(shareId: string, relPath: string): Promise<string | null> {
  const key = `${shareId}|${relPath}`;
  const hit = lruGet(frameCache, key, MAX_FRAMES);
  if (hit) return Promise.resolve(hit);

  const existing = inflight.get(key);
  if (existing) return existing;

  const job = withGrabSlot(() =>
    Promise.race([
      captureFrame(shareId, relPath).then((data) => {
        if (data) lruSet(frameCache, key, data, MAX_FRAMES);
        return data;
      }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), GRAB_TIMEOUT_MS + 1_000)
      ),
    ])
  ).finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

function captureFrame(shareId: string, relPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const video = document.createElement("video");

    const finish = (out: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute("src"); // free the decoder
      video.load();
      resolve(out);
    };

    // Network is local; give slow seeks a fair chance but never hang the grid.
    const timer = setTimeout(() => finish(null), GRAB_TIMEOUT_MS);

    const draw = () => {
      try {
        if (video.readyState < 2 || !video.videoWidth) return finish(null);
        const scale = FRAME_W / video.videoWidth;
        const canvas = document.createElement("canvas");
        canvas.width = FRAME_W;
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // webp where supported (small), png fallback (safari) — both display fine
        const webp = canvas.toDataURL("image/webp", 0.72);
        finish(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png"));
      } catch {
        finish(null);
      }
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => {
      // A frame ~10% in (or 1s) reads as "the video"; shorts fall back to 0.
      const target =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(1.5, video.duration * 0.1)
          : 0;
      const bail = setTimeout(draw, 2_500); // seek may never fire on streams
      video.onseeked = () => {
        clearTimeout(bail);
        draw();
      };
      try {
        video.currentTime = target;
      } catch {
        clearTimeout(bail);
        draw();
      }
    };
    video.onerror = () => finish(null);

    void mediaSrc(shareId, relPath)
      .then((url) => {
        if (settled) return;
        video.src = url;
      })
      .catch(() => finish(null));
  });
}
