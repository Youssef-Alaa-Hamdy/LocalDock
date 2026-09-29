/**
 * LocalDock — server-side thumbnail generation.
 *
 *  - Images : sharp (bundled dependency) — EXIF-aware resize, WebP output.
 *  - Videos : ffmpeg one-frame grab (when the binary exists on the host —
 *             Windows bundles can ship it; otherwise clients fall back to
 *             their type icon tiles automatically).
 *
 * Caching: a small in-memory LRU plus a per-installation disk cache under
 * `HOME/.thumbs/`, keyed by path+mtime+size+target-size, so repeated folder
 * views and multiple devices never re-encode the same file.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { HOME } from "./store";

const THUMBS_DIR = path.join(HOME, ".thumbs");
const MAX_MEMORY_ENTRIES = 256;
const GENERATION_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT = 2;

/* ---------- tiny LRU ---------- */

const mem = new Map<string, Buffer>();
function memGet(key: string): Buffer | undefined {
  const v = mem.get(key);
  if (v !== undefined) {
    mem.delete(key);
    mem.set(key, v); // refresh recency
  }
  return v;
}
function memSet(key: string, buf: Buffer) {
  if (mem.has(key)) mem.delete(key);
  mem.set(key, buf);
  while (mem.size > MAX_MEMORY_ENTRIES) {
    const oldest = mem.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    mem.delete(oldest);
  }
}

/* ---------- concurrency limiter ---------- */

let running = 0;
const waiters: (() => void)[] = [];
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (running >= MAX_CONCURRENT) {
    await new Promise<void>((r) => waiters.push(r));
  }
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiters.shift()?.();
  }
}

/* ---------- cache key ---------- */

function cacheKey(abs: string, stat: fs.Stats, size: number): string {
  const h = crypto.createHash("sha1");
  h.update(abs);
  h.update(`|${Math.round(stat.mtimeMs)}|${stat.size}|${size}`);
  return h.digest("hex");
}

function diskPath(key: string): string {
  // two-level fan-out keeps any single directory small
  return path.join(THUMBS_DIR, key.slice(0, 2), `${key}.webp`);
}

/* ---------- generation ---------- */

export interface ThumbResult {
  data: Buffer | null;
  fromCache?: boolean;
}

export async function getThumbnail(
  abs: string,
  stat: fs.Stats,
  size: number,
  category: "image" | "video"
): Promise<ThumbResult> {
  const key = cacheKey(abs, stat, size);

  const hit = memGet(key);
  if (hit) return { data: hit, fromCache: true };

  // disk
  const dp = diskPath(key);
  try {
    const buf = await fsp.readFile(dp);
    memSet(key, buf);
    return { data: buf, fromCache: true };
  } catch {
    /* not cached yet */
  }

  const data = await withSlot(() =>
    Promise.race([
      category === "image" ? renderImage(abs, size) : renderVideoFrame(abs, size),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), GENERATION_TIMEOUT_MS)
      ),
    ])
  );
  if (!data) return { data: null };

  memSet(key, data);
  // best-effort disk cache; never fail the request because of it
  fsp.mkdir(path.dirname(dp), { recursive: true })
    .then(() => fsp.writeFile(dp, data))
    .catch(() => undefined);
  void gcDisk();
  return { data };
}

async function renderImage(abs: string, size: number): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(abs, { limitInputPixels: 268_402_687 }) // ~16k×16k guard
      .rotate() // honor EXIF orientation
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 3 })
      .toBuffer();
    return out;
  } catch {
    return null;
  }
}

/** Grab one representative frame with ffmpeg (input seek for speed). */
async function renderVideoFrame(abs: string, size: number): Promise<Buffer | null> {
  const vf = `scale=${size}:${size}:force_original_aspect_ratio=decrease`;
  // try a frame from 10% in; fall back to the very first frame for shorts
  for (const seek of ["0.4", "0"]) {
    const buf = await ffmpegFrame(abs, seek, vf).catch(() => null);
    if (buf && buf.length > 512) {
      // normalize to webp through sharp (cheap, already loaded on demand)
      try {
        const sharp = (await import("sharp")).default;
        return await sharp(buf).webp({ quality: 80, effort: 2 }).toBuffer();
      } catch {
        return buf; // still a valid PNG/JPEG the browser can display
      }
    }
  }
  return null;
}

function ffmpegFrame(abs: string, seek: string, vf: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "ffmpeg",
      [
        "-hide_banner", "-loglevel", "error",
        "-ss", seek,
        "-i", abs,
        "-frames:v", "1",
        "-vf", vf,
        "-f", "image2pipe",
        "-vcodec", "png",
        "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    const chunks: Buffer[] = [];
    let failed = false;
    const timer = setTimeout(() => {
      failed = true;
      proc.kill("SIGKILL");
      reject(new Error("ffmpeg-timeout"));
    }, GENERATION_TIMEOUT_MS);
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", (e) => {
      clearTimeout(timer); // binary missing (ENOENT) etc.
      reject(e);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (failed) return;
      if (code === 0 && chunks.length) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg-exit-${code}`));
    });
  });
}

/* ---------- disk GC (kept tiny; runs at most once a minute) ---------- */

let lastGc = 0;
const DISK_MAX_BYTES = 64 * 1024 * 1024;
async function gcDisk() {
  const now = Date.now();
  if (now - lastGc < 60_000) return;
  lastGc = now;
  try {
    const dirs = await fsp.readdir(THUMBS_DIR, { withFileTypes: true });
    const files: { p: string; at: number; size: number }[] = [];
    let total = 0;
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const sub = path.join(THUMBS_DIR, d.name);
      for (const f of await fsp.readdir(sub)) {
        const p = path.join(sub, f);
        try {
          const s = await fsp.stat(p);
          files.push({ p, at: s.mtimeMs, size: s.size });
          total += s.size;
        } catch { /* ignore */ }
      }
    }
    if (total <= DISK_MAX_BYTES) return;
    files.sort((a, b) => a.at - b.at);
    let over = total - DISK_MAX_BYTES;
    for (const f of files) {
      if (over <= 0) break;
      await fsp.rm(f.p, { force: true }).catch(() => undefined);
      over -= f.size;
    }
  } catch {
    /* cache dir missing — nothing to GC */
  }
}
