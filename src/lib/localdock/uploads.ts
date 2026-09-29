/**
 * LocalDock — resumable chunked upload engine (server side).
 *
 * Design:
 *  - Upload sessions live in `HOME/.uploads/{uploadId}.part` (preallocated,
 *    sparse) + `{uploadId}.json` metadata.
 *  - Chunks are written at their exact offset (positional writes) — never
 *    buffered in memory as a whole file, never copied at completion (the
 *    .part file IS the final file, renamed into place).
 *  - Resume: clients ask `/api/upload/status` and only send missing chunks.
 *  - Integrity: SHA-256 computed by streaming the finished file once.
 *  - Stale sessions are garbage-collected automatically.
 */
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "./store";
import { uniquifyPath, sanitizeUploadName } from "./paths";
import type { UploadSessionInfo } from "./types";

export const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024; // 4 MiB
const MAX_CHUNK_SIZE = 16 * 1024 * 1024;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface UploadSession {
  uploadId: string;
  shareId: string;
  destRelPath: string; // relative dir inside the share ("" = root)
  originalName: string;
  finalName: string; // resolved against conflicts at init time
  size: number;
  chunkSize: number;
  totalChunks: number;
  received: number[];
  createdAt: number;
  status: "active" | "completed" | "canceled";
  sha256?: string;
  overwrite: boolean;
}

function partPath(uploadId: string): string {
  return path.join(UPLOADS_DIR, `${uploadId}.part`);
}
function metaPath(uploadId: string): string {
  return path.join(UPLOADS_DIR, `${uploadId}.json`);
}

function readSession(uploadId: string): UploadSession | undefined {
  return readJsonSafe<UploadSession>(metaPath(uploadId));
}

function readJsonSafe<T>(file: string): T | undefined {
  return readJsonFile(file) as T | undefined;
}

function readJsonFile(file: string): unknown {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return JSON.parse(require("node:fs").readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

async function writeSession(session: UploadSession): Promise<void> {
   
  const { writeJson } = await import("./store");
  await writeJson(metaPath(session.uploadId), session);
}

export function validateChunkSize(size: unknown): number {
  const n = Number(size);
  if (!Number.isFinite(n) || n < 64 * 1024) return DEFAULT_CHUNK_SIZE;
  return Math.min(Math.floor(n), MAX_CHUNK_SIZE);
}

export interface InitInput {
  shareId: string;
  dirRelPath: string;
  name: string;
  size: number;
  chunkSize?: number;
  overwrite?: boolean;
  resumeUploadId?: string;
}

export interface InitResult {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: number[];
  finalName: string;
}

export async function initUpload(
  shareRoot: string,
  input: InitInput
): Promise<InitResult> {
  // Resume path: session still alive, same share -> report state.
  if (input.resumeUploadId) {
    const session = readSession(input.resumeUploadId);
    if (
      session &&
      session.status === "active" &&
      session.shareId === input.shareId &&
      Date.now() - session.createdAt < SESSION_TTL_MS
    ) {
      return {
        uploadId: session.uploadId,
        chunkSize: session.chunkSize,
        totalChunks: session.totalChunks,
        receivedChunks: [...session.received],
        finalName: session.finalName,
      };
    }
    // dead session -> fall through and create a fresh one
  }

  const safeName = sanitizeUploadName(input.name);
  if (!safeName) throw new Error("invalid-name");
  const size = Math.max(0, Math.floor(Number(input.size) || 0));
  const chunkSize = validateChunkSize(input.chunkSize);
  const totalChunks = Math.max(1, Math.ceil(size / chunkSize));

  const destDir = path.resolve(shareRoot, input.dirRelPath || "");
  if (!destDir.startsWith(path.resolve(shareRoot))) throw new Error("invalid-dir");

  const overwrite = !!input.overwrite;
  const finalPath = overwrite
    ? path.join(destDir, safeName)
    : uniquifyPath(destDir, safeName);
  const finalName = path.basename(finalPath);

  const uploadId = crypto.randomUUID();
  const session: UploadSession = {
    uploadId,
    shareId: input.shareId,
    destRelPath: input.dirRelPath || "",
    originalName: input.name,
    finalName,
    size,
    chunkSize,
    totalChunks,
    received: [],
    createdAt: Date.now(),
    status: "active",
    overwrite,
  };

  // Preallocate (sparse) so positional writes never need to extend the file
  // racing each other; on most filesystems this is O(1).
  const fh = await fsp.open(partPath(uploadId), "w+");
  try {
    if (size > 0) await fh.truncate(size);
  } finally {
    await fh.close();
  }
  await writeSession(session);

  return {
    uploadId,
    chunkSize,
    totalChunks,
    receivedChunks: [],
    finalName,
  };
}

export async function writeChunk(
  uploadId: string,
  index: number,
  data: Buffer
): Promise<{ received: number; totalChunks: number }> {
  const session = readSession(uploadId);
  if (!session || session.status !== "active") throw new Error("session-not-found");
  if (!Number.isInteger(index) || index < 0 || index >= session.totalChunks) {
    throw new Error("invalid-chunk-index");
  }
  const expectedLen =
    index === session.totalChunks - 1
      ? session.size - (session.totalChunks - 1) * session.chunkSize
      : session.chunkSize;
  if (data.length === 0 || data.length > session.chunkSize) {
    throw new Error("invalid-chunk-size");
  }
  if (session.size > 0 && expectedLen > 0 && data.length > expectedLen) {
    throw new Error("invalid-chunk-size");
  }

  const fh = await fsp.open(partPath(uploadId), "r+");
  try {
    await fh.write(data, 0, data.length, index * session.chunkSize);
  } finally {
    await fh.close();
  }

  if (!session.received.includes(index)) session.received.push(index);
  await writeSession(session);
  return { received: session.received.length, totalChunks: session.totalChunks };
}

export async function statusOf(
  uploadId: string
): Promise<UploadSessionInfo | undefined> {
  const session = readSession(uploadId);
  if (!session) return undefined;
  return toInfo(session);
}

export async function completeUpload(
  uploadId: string,
  expectedSha256?: string
): Promise<UploadSessionInfo> {
  const session = readSession(uploadId);
  if (!session || session.status !== "active") {
    if (session?.status === "completed") return toInfo(session);
    throw new Error("session-not-found");
  }
  const missing: number[] = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!session.received.includes(i)) missing.push(i);
  }
  if (missing.length > 0) {
    const err = new Error("missing-chunks") as Error & { missing?: number[] };
    err.missing = missing;
    throw err;
  }

  // Verify size
  const part = partPath(uploadId);
  const stat = await fsp.stat(part);
  if (session.size > 0 && stat.size !== session.size) {
    throw new Error("size-mismatch");
  }

  // Integrity: stream the file once to compute SHA-256.
  const hash = crypto.createHash("sha256");
  await pipelineHash(part, hash);
  const hex = hash.digest("hex");
  if (expectedSha256 && expectedSha256.toLowerCase() !== hex) {
    const err = new Error("checksum-mismatch");
    await fsp.unlink(part).catch(() => undefined);
    throw err;
  }

  // Move into destination (rename within same filesystem = instant even for TBs).
  const shareRoot = resolveShareRootForSession(session);
  const destDir = path.resolve(shareRoot, session.destRelPath || "");
  let finalPath = path.join(destDir, session.finalName);
  if (!session.overwrite) {
    finalPath = uniquifyPath(destDir, session.finalName);
  }
  await fsp.mkdir(destDir, { recursive: true });
  try {
    await fsp.rename(part, finalPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "EXDEV") {
      // Cross-drive transfer on Windows (e.g. C: temp upload -> D: share)
      await fsp.copyFile(part, finalPath);
      await fsp.unlink(part).catch(() => undefined);
    } else {
      throw err;
    }
  }

  session.status = "completed";
  session.finalName = path.basename(finalPath);
  session.sha256 = hex;
  await writeSession(session);
  return toInfo(session);
}

export async function cancelUpload(uploadId: string): Promise<boolean> {
  const session = readSession(uploadId);
  if (!session) return false;
  session.status = "canceled";
  await fsp.rm(partPath(uploadId), { force: true });
  await fsp.rm(metaPath(uploadId), { force: true });
  return true;
}

/** Cleanup stale sessions (crash-safe, called on server start + periodically). */
export async function gcUploads(): Promise<void> {
  try {
    const names = await fsp.readdir(UPLOADS_DIR);
    const now = Date.now();
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const full = path.join(UPLOADS_DIR, name);
      const session = readJsonSafe<UploadSession>(full);
      if (!session || now - session.createdAt > SESSION_TTL_MS) {
        await fsp.rm(full, { force: true });
        await fsp.rm(path.join(UPLOADS_DIR, name.replace(/\.json$/, ".part")), {
          force: true,
        });
      }
    }
  } catch {
    // best-effort
  }
}

/* ---------- wiring helpers (lazy to avoid cycles) ---------- */

function resolveShareRootForSession(session: UploadSession): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getShare } = require("./registry") as typeof import("./registry");
  const share = getShare(session.shareId);
  if (!share) throw new Error("share-gone");
  return share.rootPath;
}

function toInfo(session: UploadSession): UploadSessionInfo {
  return {
    uploadId: session.uploadId,
    shareId: session.shareId,
    name: session.originalName,
    finalName: session.finalName,
    size: session.size,
    chunkSize: session.chunkSize,
    totalChunks: session.totalChunks,
    receivedChunks: [...session.received],
    createdAt: session.createdAt,
    status: session.status,
    sha256: session.sha256,
  };
}

async function pipelineHash(file: string, hash: crypto.Hash): Promise<void> {
  const stream = (await import("node:fs")).createReadStream(file, {
    highWaterMark: 1024 * 1024,
  });
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
}
