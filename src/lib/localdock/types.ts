/**
 * LocalDock — Core domain types
 * Single source of truth shared by server and client.
 */

export type ShareAccess = "read" | "readwrite";

export interface Share {
  id: string;
  name: string;
  slug: string;
  /** Absolute path of the shared folder root on the server machine. */
  rootPath: string;
  createdAt: number;
  access: ShareAccess;
  /** When true, unpaired browsers may access this share (with `access` level). */
  guestEnabled: boolean;
  /** "all" or a list of trusted device ids allowed to use this share. */
  allowedDevices: "all" | string[];
  /** Cached stats (recomputed asynchronously). */
  sizeBytes: number;
  itemCount: number;
  lastScanAt: number | null;
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  pairedAt: number;
  lastSeenAt: number;
  /** SHA-256 hex of the device token. The raw token never leaves pairing response. */
  tokenHash: string;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  /** Absolute path of the site folder (must contain index.html). */
  rootPath: string;
  enabled: boolean;
  createdAt: number;
}

export type ActivityType =
  | "share.created"
  | "share.updated"
  | "share.deleted"
  | "file.uploaded"
  | "file.downloaded"
  | "file.created"
  | "file.renamed"
  | "file.deleted"
  | "device.paired"
  | "device.revoked"
  | "website.hosted"
  | "website.stopped"
  | "website.removed"
  | "server.started"
  | "transfer.failed"
  | "security.denied";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  at: number;
  meta?: Record<string, string | number | boolean | null>;
}

export interface LocalDockSettings {
  serverId: string;
  serverName: string;
  ownerKey: string;
  createdAt: number;
  onboarded: boolean;
  /** Desktop-build feature flag persisted for the Windows shell. */
  startWithWindows: boolean;
  /**
   * When false, owner APIs reject requests that do not originate from the
   * server machine (loopback / private LAN). The packaged desktop build
   * forces this to false. Demo/web preview keeps it true so the product is
   * usable through its preview URL.
   */
  allowRemoteOwner: boolean;
  theme: "light" | "dark" | "system";
}

export interface SystemStatus {
  online: boolean;
  version: string;
  serverId: string;
  serverName: string;
  startedAt: number;
  uptimeSec: number;
  devicesOnline: number;
  devicesTrusted: number;
  sharesCount: number;
  sharedBytes: number;
  transferSpeedBps: number;
  activeTransfers: number;
  platform: string;
  hostname: string;
  network: { name: string; address: string }[];
  /** Primary LAN IPv4 chosen server-side (same scoring as bootstrap). */
  lanIp?: string | null;
  storage: { freeBytes: number; totalBytes: number };
}

export interface FileEntry {
  name: string;
  kind: "dir" | "file";
  size: number;
  modifiedAt: number;
  mimeType?: string;
  category: FileCategory;
}

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "text"
  | "code"
  | "archive"
  | "apk"
  | "other";

export interface UploadSessionInfo {
  uploadId: string;
  shareId: string;
  name: string;
  finalName: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: number[];
  createdAt: number;
  status: "active" | "completed" | "canceled";
  sha256?: string;
}

/* ---------- API auth context ---------- */

export type AuthKind = "owner" | "device" | "guest" | "none";

export interface AuthContext {
  kind: AuthKind;
  device?: Device;
}

/* ---------- Cross-device live transfer activity ---------- */

/**
 * A transfer currently in flight (or just finished) on ANY device connected
 * to this server. Surfaced to every open client so everyone sees the same
 * live "who is transferring what" picture — like a pro transfer tool.
 */
export interface TransferActivity {
  /** Server-side id (uploadId for uploads, clientId+path for downloads). */
  id: string;
  shareId: string;
  kind: "upload" | "download";
  name: string;
  size: number;
  transferred: number;
  /** Human label: device name, "Owner console" or "Guest". */
  device: string;
  /** Opaque client id so a device can filter out its own transfers. */
  clientId: string;
  /** Uploads: destination dir inside the share ("" = root). */
  dirPath?: string;
  startedAt: number;
  updatedAt: number;
  status: "active" | "done" | "failed" | "canceled";
}

/* ---------- Transfer engine (client side) ---------- */

export type TransferKind = "upload" | "download";
export type TransferStatus =
  | "queued"
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface TransferItem {
  id: string;
  kind: TransferKind;
  shareId: string;
  shareName: string;
  /** For uploads: relative dir inside the share. For downloads: relative file path. */
  path: string;
  name: string;
  size: number;
  transferred: number;
  status: TransferStatus;
  speedBps: number;
  etaSec: number | null;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  /** engine internals (not rendered directly) */
  chunkSize: number;
  totalChunks: number;
  receivedChunks: Set<number>;
  uploadId?: string;
  controller?: AbortController;
  file?: File;
  hashHex?: string;
  /** Uploads restored from a previous page load: the file must be re-picked. */
  needsFile?: boolean;
  /**
   * Live count of parallel connections this transfer is using (IDM-style
   * chunked engine). Displayed as a badge; 0/undefined = single stream.
   */
  connections?: number;
}
