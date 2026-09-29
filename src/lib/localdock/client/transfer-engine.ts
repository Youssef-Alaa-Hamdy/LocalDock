"use client";

/**
 * LocalDock — client Transfer Engine.
 *
 * Responsibilities:
 *  - Queue with bounded concurrency (2 parallel files, backpressure per chunk).
 *  - Chunked resumable uploads: init -> missing chunks -> complete(sha256).
 *  - Streaming downloads: File System Access API when available (real disk
 *    streaming + pause/resume + cross-reload resume via IndexedDB handle),
 *    blob fallback for smaller files elsewhere.
 *  - Live speed / ETA per transfer.
 *  - Persistence: the queue survives reloads; upload sessions reconcile
 *    with the server ("resume from 6.2 GB").
 *  - Auto-retry on network blips with capped exponential backoff.
 */
import { create } from "zustand";
import type { TransferItem, TransferStatus } from "../types";
import { Api, getOwnerKey, getDeviceToken, makeApiError } from "./api";

const CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_PARALLEL = 2;
const MAX_AUTO_RETRIES = 4;
const PERSIST_KEY = "localdock.transfers.v2";

interface PersistedTransfer {
  id: string;
  kind: TransferItem["kind"];
  shareId: string;
  shareName: string;
  path: string;
  name: string;
  size: number;
  transferred: number;
  chunkSize: number;
  totalChunks: number;
  uploadId?: string;
  createdAt: number;
  status: TransferStatus;
  error?: string;
  needsFile?: boolean;
}

interface TransfersState {
  items: TransferItem[];
  connected: boolean;
  add: (item: TransferItem) => void;
  patch: (id: string, patch: Partial<TransferItem>) => void;
  remove: (id: string) => void;
  setConnected: (v: boolean) => void;
}

export const useTransfers = create<TransfersState>((set) => ({
  items: [],
  connected: true,
  add: (item) => set((s) => ({ items: [item, ...s.items] })),
  patch: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
  setConnected: (v) => set({ connected: v }),
}));

/**
 * Auth headers for raw (non-Api) transfer fetches. Both identities are sent:
 * the owner key covers the console, the device token covers paired phones —
 * without it, chunk PUTs from a paired device used to 403 mid-transfer.
 */
function transferHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "X-LocalDock-Owner": getOwnerKey() ?? "",
    "X-LocalDock-Device": getDeviceToken() ?? "",
    ...extra,
  };
}

/** Items the floating TransferDock should stay visible for. */
export function selectDockItems(items: TransferItem[]): TransferItem[] {
  return items.filter(
    (i) =>
      i.status === "active" ||
      i.status === "queued" ||
      i.status === "failed" ||
      (i.status === "paused" && i.kind === "upload" && !i.file)
  );
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Sliding-window speed sampler (bytes over last 2.5s). */
class Speedometer {
  private samples: { at: number; bytes: number }[] = [];
  push(bytes: number) {
    const now = Date.now();
    this.samples.push({ at: now, bytes });
    while (this.samples.length && now - this.samples[0].at > 2500) this.samples.shift();
  }
  get bps(): number {
    const now = Date.now();
    let bytes = 0;
    for (const s of this.samples) {
      if (now - s.at <= 2500) bytes += s.bytes;
    }
    return Math.round((bytes * 1000) / 2500);
  }
}

/* ------------------------------------------------------------------ */
/* IndexedDB handle storage (cross-reload download resume)             */
/* ------------------------------------------------------------------ */

const idb = {
  async open(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") return null;
    return new Promise((resolve) => {
      const req = indexedDB.open("localdock", 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("handles");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  },
  async put(key: string, value: unknown): Promise<void> {
    const db = await idb.open();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },
  async get<T>(key: string): Promise<T | null> {
    const db = await idb.open();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("handles", "readonly");
      const req = tx.objectStore("handles").get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  },
  async del(key: string): Promise<void> {
    const db = await idb.open();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

class TransferEngine {
  private running = 0;
  private speedometers = new Map<string, Speedometer>();
  private booted = false;
  private lastActivityReport = new Map<string, number>();
  private uploadCompletedListeners = new Set<
    (info: { shareId: string; dirPath: string; name: string }) => void
  >();

  /**
   * Subscribe to upload completions — used by the file browser to refresh the
   * open folder the moment a file lands on disk (no manual re-entry needed).
   * Returns an unsubscribe function.
   */
  onUploadCompleted(
    listener: (info: { shareId: string; dirPath: string; name: string }) => void
  ): () => void {
    this.uploadCompletedListeners.add(listener);
    return () => this.uploadCompletedListeners.delete(listener);
  }

  private notifyUploadCompleted(info: { shareId: string; dirPath: string; name: string }) {
    for (const l of this.uploadCompletedListeners) {
      try {
        l(info);
      } catch {
        /* listener errors must never break the queue */
      }
    }
  }

  /**
   * Cross-device download heartbeat. Throttled to ~1/s (unless `force`); the
   * server exposes these through the ?summary=1 poll, so every other open
   * device sees this download live — the same picture uploads already get.
   * Failures are deliberately swallowed: activity display must never break
   * the actual transfer.
   */
  private reportActivity(
    item: TransferItem,
    status: "active" | "done" | "failed" | "canceled" = "active",
    force = false
  ) {
    if (typeof window === "undefined") return;
    const now = Date.now();
    if (!force) {
      const last = this.lastActivityReport.get(item.id) ?? 0;
      if (now - last < 1000) return;
    }
    this.lastActivityReport.set(item.id, now);
    void Api.reportTransfer(item.shareId, {
      key: `dl-${item.id}`.slice(0, 80),
      name: item.name,
      size: item.size,
      transferred: Math.min(item.transferred, item.size),
      status,
    });
    if (status !== "active") this.lastActivityReport.delete(item.id);
  }

  boot() {
    if (this.booted || typeof window === "undefined") return;
    this.booted = true;
    void this.restore();
    window.addEventListener("online", () => this.retryInterrupted());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.retryInterrupted();
    });
  }

  get items() {
    return useTransfers.getState().items;
  }

  /* ---------- public API ---------- */

  enqueueUpload(input: {
    shareId: string;
    shareName: string;
    dirPath: string;
    file: File;
  }): string {
    const id = uid();
    const item: TransferItem = {
      id,
      kind: "upload",
      shareId: input.shareId,
      shareName: input.shareName,
      path: input.dirPath,
      name: input.file.name,
      size: input.file.size,
      transferred: 0,
      status: "queued",
      speedBps: 0,
      etaSec: null,
      createdAt: Date.now(),
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.max(1, Math.ceil(input.file.size / CHUNK_SIZE)),
      receivedChunks: new Set<number>(),
      file: input.file,
      controller: new AbortController(),
    };
    useTransfers.getState().add(item);
    this.persist();
    this.pump();
    return id;
  }

  /** Re-attach a picked file to an interrupted (restored) upload, then resume. */
  reattachUpload(id: string, file: File): { ok: boolean; reason?: string } {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.kind !== "upload") return { ok: false, reason: "Transfer not found." };
    if (file.name !== item.name || file.size !== item.size) {
      return {
        ok: false,
        reason: "That's a different file — pick the same file to resume this transfer.",
      };
    }
    useTransfers.getState().patch(id, { file, status: "queued", needsFile: false, error: undefined });
    this.persist();
    this.pump();
    return { ok: true };
  }

  enqueueDownload(input: {
    shareId: string;
    shareName: string;
    filePath: string;
    name: string;
    size: number;
  }): string {
    const id = uid();
    const item: TransferItem = {
      id,
      kind: "download",
      shareId: input.shareId,
      shareName: input.shareName,
      path: input.filePath,
      name: input.name,
      size: input.size,
      transferred: 0,
      status: "queued",
      speedBps: 0,
      etaSec: null,
      createdAt: Date.now(),
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.max(1, Math.ceil(input.size / CHUNK_SIZE)),
      receivedChunks: new Set<number>(),
      controller: new AbortController(),
    };
    useTransfers.getState().add(item);
    this.persist();
    this.pump();
    return id;
  }

  pause(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    if (item.status === "active" || item.status === "queued") {
      item.controller?.abort();
      useTransfers.getState().patch(id, { status: "paused", speedBps: 0, etaSec: null });
      this.persist();
    }
  }

  resume(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    if (item.status === "paused") {
      if (item.kind === "upload" && !item.file) {
        useTransfers.getState().patch(id, { needsFile: true });
        this.persist();
        return;
      }
      useTransfers.getState().patch(id, {
        status: "queued",
        error: undefined,
        controller: new AbortController(),
      });
      this.persist();
      this.pump();
    }
  }

  async cancel(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.controller?.abort();
    if (item.kind === "upload" && item.uploadId) {
      await Api.uploadCancel(item.uploadId).catch(() => undefined);
    }
    if (item.kind === "download") {
      await idb.del(id);
      this.reportActivity(item, "canceled", true); // vanish instantly elsewhere
    }
    useTransfers.getState().patch(id, { status: "canceled" });
    this.persist();
  }

  retry(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    if (item.kind === "upload" && !item.file) {
      useTransfers.getState().patch(id, { needsFile: true });
      this.persist();
      return;
    }
    useTransfers.getState().patch(id, {
      status: "queued",
      transferred: item.kind === "download" ? item.transferred : item.transferred,
      error: undefined,
      controller: new AbortController(),
    });
    this.persist();
    this.pump();
  }

  dismiss(id: string) {
    this.cancel(id).finally(() => {
      setTimeout(() => useTransfers.getState().remove(id), 0);
      this.persist();
    });
  }

  /* ---------- queue machinery ---------- */

  private pump() {
    if (this.running >= MAX_PARALLEL) return;
    const state = useTransfers.getState();
    const next = state.items.find(
      (i) => i.status === "queued" && (i.kind === "download" || !!i.file)
    );
    if (!next) return;
    this.running++;
    useTransfers.getState().patch(next.id, { status: "active", startedAt: Date.now() });
    void this.run(next)
      .catch((err: Error & { code?: string }) => {
        this.handleFailure(next.id, err);
      })
      .finally(() => {
        this.running--;
        this.persist();
        this.pump();
      });
  }

  private handleFailure(id: string, err: Error & { code?: string; friendly?: string }) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    const state = useTransfers.getState();
    // paused or canceled by the user? controller abort lands here too.
    if (item.status !== "active") return;

    const networkish =
      err.code === "network" || err.code === "http-0" || !err.code;
    if (networkish) {
      state.setConnected(false);
      state.patch(id, { status: "paused", error: "Connection lost — waiting for the network…" });
      this.persist();
      setTimeout(() => {
        const cur = this.items.find((i) => i.id === id);
        if (cur && cur.status === "paused") this.retry(id);
      }, 3000);
      return;
    }
    state.patch(id, {
      status: "failed",
      error: err.friendly || err.message || "The transfer failed.",
    });
    if (item.kind === "download") this.reportActivity(item, "failed", true);
    this.persist();
  }

  /* ---------- upload runner ---------- */

  private async run(item: TransferItem) {
    useTransfers.getState().setConnected(true);
    if (item.kind === "upload") await this.runUpload(item);
    else await this.runDownload(item);
  }

  private async runUpload(item: TransferItem) {
    const file = item.file!;
    let received = new Set(item.receivedChunks);
    let uploadId = item.uploadId;

    const initOrResume = async (): Promise<void> => {
      const res = await Api.uploadInit({
        shareId: item.shareId,
        dirPath: item.path,
        name: file.name,
        size: file.size,
        chunkSize: item.chunkSize,
        resumeUploadId: uploadId,
      });
      uploadId = res.uploadId;
      item.uploadId = uploadId;
      item.totalChunks = res.totalChunks;
      item.chunkSize = res.chunkSize;
      received = new Set(res.receivedChunks);
      useTransfers.getState().patch(item.id, {
        uploadId,
        totalChunks: res.totalChunks,
        chunkSize: res.chunkSize,
        receivedChunks: received,
        name: res.finalName,
      });
    };

    await this.withRetry(item, initOrResume);
    if (!this.stillActive(item.id)) return;

    const bytesOf = (chunks: Set<number>): number => {
      let sum = 0;
      for (const i of chunks) {
        const isLast = i === item.totalChunks - 1;
        sum += isLast
          ? Math.max(0, item.size - (item.totalChunks - 1) * item.chunkSize)
          : item.chunkSize;
      }
      return sum;
    };

    // chunks already on the server count instantly
    useTransfers.getState().patch(item.id, { transferred: bytesOf(received) });

    const speedo = this.speedo(item.id);

    let pass = 0;
    for (;;) {
      if (!this.stillActive(item.id)) return;
      pass++;
      if (pass > item.totalChunks + 6) {
        throw makeApiError(0, "stalled", "The upload stalled and could not finish.");
      }
      // find next missing chunk
      let index = -1;
      for (let i = 0; i < item.totalChunks; i++) {
        if (!received.has(i)) {
          index = i;
          break;
        }
      }
      if (index === -1) break; // all chunks received

      const start = index * item.chunkSize;
      const end = Math.min(file.size, start + item.chunkSize);
      const blob = file.slice(start, end);

      await this.withRetry(item, async () => {
        const res = await fetch(
          `/api/upload/chunk?uploadId=${encodeURIComponent(uploadId!)}&index=${index}`,
          {
            method: "PUT",
            body: blob,
            headers: transferHeaders({ "Content-Type": "application/octet-stream" }),
            signal: item.controller?.signal,
          }
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: { code?: string; message?: string } }
            | null;
          throw makeApiError(
            res.status,
            body?.error?.code ?? `http-${res.status}`,
            body?.error?.message ?? "A chunk failed to upload."
          );
        }
        received.add(index);
        speedo.push(blob.size);
        const transferred = bytesOf(received);
        const bps = speedo.bps;
        useTransfers.getState().patch(item.id, {
          transferred: Math.min(transferred, item.size),
          speedBps: bps,
          etaSec: bps > 0 ? (item.size - transferred) / bps : null,
          receivedChunks: new Set(received),
        });
      });
      this.persistThrottled();
    }

    if (!this.stillActive(item.id)) return;

    // Finalize + server-side integrity check
    await this.withRetry(item, async () => {
      const res = await Api.uploadComplete(item.uploadId!);
      if (res.incomplete) {
        const missing = res.missingChunks ?? [];
        received = new Set([...received].filter((i) => !missing.includes(i)));
        return; // loop will resend missing chunks
      }
      const info = res.upload;
      if (!info) {
        // Server confirmed completion but sent no session info — treat as done.
        useTransfers.getState().patch(item.id, {
          status: "completed",
          transferred: item.size,
          speedBps: 0,
          etaSec: null,
          completedAt: Date.now(),
        });
        this.persist();
        this.notifyUploadCompleted({
          shareId: item.shareId,
          dirPath: item.path,
          name: item.name,
        });
        return;
      }
      useTransfers.getState().patch(item.id, {
        status: "completed",
        transferred: item.size,
        speedBps: 0,
        etaSec: null,
        completedAt: Date.now(),
        name: info.finalName,
        hashHex: info.sha256,
      });
      this.persist();
      // Tell the UI (file browser, etc.) that a file just landed on disk.
      this.notifyUploadCompleted({
        shareId: item.shareId,
        dirPath: item.path,
        name: info.finalName,
      });
    });
  }

  /* ---------- download runner ---------- */

  private async runDownload(item: TransferItem) {
    const speedo = this.speedo(item.id);
    this.reportActivity(item, "active", true); // tell the other devices
    const canStream =
      typeof window !== "undefined" &&
      "showSaveFilePicker" in window &&
      item.size > 8 * 1024 * 1024;

    if (!canStream) {
      await this.downloadToBlob(item, speedo);
      return;
    }

    // Streaming to disk with pause/resume + cross-reload resume.
    let handle: FileSystemFileHandle | null =
      (await idb.get<FileSystemFileHandle>(item.id)) ?? null;

    try {
      if (!handle) {
        handle = await (window as unknown as {
          showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
        }).showSaveFilePicker({
          suggestedName: item.name,
          types: [{ description: "File", accept: { "*/*": [`.${this.extOf(item.name) || "bin"}`] } }],
        });
        await idb.put(item.id, handle);
      }
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "AbortError") {
        useTransfers.getState().patch(item.id, { status: "paused", error: undefined });
        this.persist();
        return;
      }
      await this.downloadToBlob(item, speedo);
      return;
    }

    // Resume point: current size on disk
    let offset = 0;
    try {
      const file = await handle.getFile();
      offset = Math.min(file.size, item.size);
    } catch {
      offset = 0;
    }
    if (offset >= item.size && item.size > 0) {
      useTransfers.getState().patch(item.id, {
        status: "completed",
        transferred: item.size,
        completedAt: Date.now(),
        speedBps: 0,
        etaSec: null,
      });
      await idb.del(item.id);
      this.reportActivity(item, "done", true);
      this.persist();
      return;
    }
    useTransfers.getState().patch(item.id, { transferred: offset });

    while (offset < item.size) {
      if (!this.stillActive(item.id)) return;
      const end = Math.min(item.size, offset + CHUNK_SIZE) - 1;
      await this.withRetry(item, async () => {
        const url = `/api/shares/${item.shareId}/download?path=${encodeURIComponent(item.path)}`;
        const res = await fetch(url, {
          headers: transferHeaders({ Range: `bytes=${offset}-${end}` }),
          signal: item.controller?.signal,
        });
        if (!res.ok && res.status !== 206) {
          const body = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          throw makeApiError(res.status, `http-${res.status}`, body?.error?.message ?? "Download failed.");
        }
        const writable = await (
          handle as FileSystemFileHandle & {
            createWritable: (opts?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
          }
        ).createWritable({ keepExistingData: true });
        await writable.seek(offset);
        const reader = res.body!.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          await writable.write(value);
          offset += value.byteLength;
          speedo.push(value.byteLength);
          const bps = speedo.bps;
          useTransfers.getState().patch(item.id, {
            transferred: offset,
            speedBps: bps,
            etaSec: bps > 0 ? (item.size - offset) / bps : null,
          });
          this.reportActivity(item); // throttled heartbeat for other devices
        }
        await writable.close();
      });
      this.persistThrottled();
    }

    useTransfers.getState().patch(item.id, {
      status: "completed",
      transferred: item.size,
      speedBps: 0,
      etaSec: null,
      completedAt: Date.now(),
    });
    await idb.del(item.id);
    this.reportActivity(item, "done", true);
    this.persist();
  }

  private async downloadToBlob(item: TransferItem, speedo: Speedometer) {
    const url = `/api/shares/${item.shareId}/download?path=${encodeURIComponent(item.path)}`;
    const headers = transferHeaders(
      item.transferred > 0 ? { Range: `bytes=${item.transferred}-` } : {}
    );
    this.reportActivity(item, "active", true);

    const res = await fetch(url, {
      headers,
      signal: item.controller?.signal,
    });
    if (!res.ok && res.status !== 206) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw makeApiError(res.status, `http-${res.status}`, body?.error?.message ?? "Download failed.");
    }

    const total = Number(res.headers.get("Content-Length") ?? 0) + (res.status === 206 ? item.transferred : 0);
    const reader = res.body!.getReader();
    const chunks: BlobPart[] = [];
    let received = res.status === 206 ? item.transferred : 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      speedo.push(value.byteLength);
      const bps = speedo.bps;
      useTransfers.getState().patch(item.id, {
        transferred: received,
        speedBps: bps,
        etaSec: bps > 0 ? Math.max(0, item.size - received) / bps : null,
      });
      this.reportActivity(item); // throttled heartbeat for other devices
    }

    const finalBuffer = chunks as BlobPart[];
    const blob = new Blob(finalBuffer);
    const filename = item.name;
    const url2 = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url2;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url2), 30_000);

    useTransfers.getState().patch(item.id, {
      status: "completed",
      transferred: item.size,
      speedBps: 0,
      etaSec: null,
      completedAt: Date.now(),
    });
    void total;
    this.reportActivity(item, "done", true);
    this.persist();
  }

  /* ---------- helpers ---------- */

  private speedo(id: string): Speedometer {
    let s = this.speedometers.get(id);
    if (!s) {
      s = new Speedometer();
      this.speedometers.set(id, s);
    }
    return s;
  }

  private stillActive(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    return !!item && item.status === "active";
  }

  private extOf(name: string): string {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(i + 1) : "";
  }

  private async withRetry(item: TransferItem, fn: () => Promise<void>): Promise<void> {
    let attempt = 0;
    for (;;) {
      try {
        await fn();
        return;
      } catch (err) {
        const e = err as Error & { name?: string; code?: string };
        if (e.name === "AbortError") throw e;
        attempt++;
        if (attempt > MAX_AUTO_RETRIES || (e.code && !["network", "http-0", "http-502", "http-503", "http-504"].includes(e.code))) {
          throw e;
        }
        await new Promise((r) => setTimeout(r, Math.min(800 * 2 ** attempt, 8000)));
        useTransfers.getState().patch(item.id, { speedBps: 0 });
      }
    }
  }

  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private persistThrottled() {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, 800);
  }

  private persist() {
    if (typeof window === "undefined") return;
    const snapshot: PersistedTransfer[] = this.items
      .filter((i) => ["queued", "active", "paused", "failed"].includes(i.status))
      .map((i) => ({
        id: i.id,
        kind: i.kind,
        shareId: i.shareId,
        shareName: i.shareName,
        path: i.path,
        name: i.name,
        size: i.size,
        transferred: i.transferred,
        chunkSize: i.chunkSize,
        totalChunks: i.totalChunks,
        uploadId: i.uploadId,
        createdAt: i.createdAt,
        status: i.status === "active" ? "paused" : i.status,
        error: i.error,
        needsFile: i.kind === "upload",
      }));
    try {
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage full — non-fatal */
    }
  }

  private async restore() {
    let snapshot: PersistedTransfer[] = [];
    try {
      snapshot = JSON.parse(window.localStorage.getItem(PERSIST_KEY) ?? "[]");
    } catch {
      return;
    }
    if (!snapshot.length) return;

    const restored: TransferItem[] = [];
    for (const p of snapshot) {
      if (p.kind === "upload") {
        // Reconcile with the server: is the session still alive?
        let received = 0;
        if (p.uploadId) {
          try {
            const res = await Api.uploadStatus(p.uploadId);
            if (res.session) received = res.session.receivedChunks.length;
          } catch {
            /* server unreachable; keep paused */
          }
        }
        restored.push({
          ...p,
          transferred: received * p.chunkSize,
          receivedChunks: new Set(),
          status: "paused",
          speedBps: 0,
          etaSec: null,
          error: "Reconnect: pick the same file again to resume.",
          file: undefined,
          controller: undefined,
        } as unknown as TransferItem);
      } else {
        // download: try to find a persisted file handle
        const handle = await idb.get<FileSystemFileHandle>(p.id);
        if (!handle) continue; // blob downloads can't resume across reloads
        let transferred = p.transferred;
        try {
          const f = await handle.getFile();
          transferred = Math.min(f.size, p.size);
        } catch {
          /* keep value */
        }
        restored.push({
          ...p,
          transferred,
          receivedChunks: new Set(),
          status: "paused",
          speedBps: 0,
          etaSec: null,
          error: undefined,
          controller: undefined,
        } as unknown as TransferItem);
      }
    }
    if (restored.length) {
      useTransfers.setState((s) => ({ items: [...restored, ...s.items] }));
      this.persist();
    }
  }

  private retryInterrupted() {
    useTransfers.getState().setConnected(true);
    for (const item of this.items) {
      if (item.status === "paused" && item.error?.includes("network")) this.retry(item.id);
    }
  }
}

export const transfers = new TransferEngine();

/* Convenience selectors */
export function selectActiveCount(items: TransferItem[]): number {
  return items.filter((i) => i.status === "active" || i.status === "queued").length;
}
