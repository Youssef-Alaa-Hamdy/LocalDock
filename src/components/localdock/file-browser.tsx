"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FileEntry, TransferActivity } from "@/lib/localdock/types";
import { Api, getClientId } from "@/lib/localdock/client/api";
import {
  serverThumb,
  markServerMiss,
  fullImageSrc,
  cachedVideoFrame,
  grabVideoFrame,
} from "@/lib/localdock/client/thumbs-client";
import {
  transfers,
  useTransfers,
  selectDockItems,
} from "@/lib/localdock/client/transfer-engine";
import { pickDeviceFolder, joinDirPath } from "@/lib/localdock/client/device-folder";
import {
  formatBytes,
  formatDateTime,
  formatEta,
  formatSpeed,
  pct,
} from "@/lib/localdock/client/format";
import { useRefresh } from "./data-hooks";
import { PreviewModal } from "./preview-modal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  FileQuestion,
  FolderPlus,
  FolderUp,
  Folder,
  Grid2X2,
  Image as ImageIcon,
  List,
  Loader2,
  MonitorSmartphone,
  MoreVertical,
  Package,
  Pencil,
  Play,
  Scaling,
  Search,
  Smartphone,
  Trash2,
  Upload,
  X,
  FileDown,
  ArrowUpAZ,
  ArrowDownAZ,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

type SortKey = "name" | "size" | "modified";

const TILE_KEY = "localdock.tileSize";
const TILE_MIN = 96;
const TILE_MAX = 280;
const TILE_DEFAULT = 160;
/** One-tap presets inside the icon-size popover (Explorer-style zoom stops). */
const TILE_PRESETS: { label: string; v: number }[] = [
  { label: "S", v: 96 },
  { label: "M", v: 144 },
  { label: "L", v: 192 },
  { label: "XL", v: 256 },
];

/** Directory fingerprint used for live refresh (count + total size + newest mtime). */
function fingerprintOf(entries: FileEntry[]): string {
  let size = 0;
  let latest = 0;
  for (const e of entries) {
    size += e.size;
    if (e.modifiedAt > latest) latest = e.modifiedAt;
  }
  return `${entries.length}:${size}:${Math.round(latest)}`;
}

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  image: { icon: ImageIcon, tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  video: { icon: FileVideo, tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  audio: { icon: FileAudio, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  pdf: { icon: FileText, tone: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  text: { icon: FileText, tone: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" },
  code: { icon: FileCode, tone: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
  archive: { icon: FileArchive, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  apk: { icon: Smartphone, tone: "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300" },
  other: { icon: FileQuestion, tone: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-300" },
};

export function FileIcon({ entry, className }: { entry: FileEntry; className?: string }) {
  if (entry.kind === "dir") {
    return (
      <span className={cn("flex items-center justify-center rounded-xl bg-primary/10 text-primary", className)}>
        <Folder className="size-5" strokeWidth={1.8} />
      </span>
    );
  }
  const conf = CATEGORY_ICONS[entry.category] ?? CATEGORY_ICONS.other;
  const Icon = conf.icon;
  return (
    <span className={cn("flex items-center justify-center rounded-xl", conf.tone, className)}>
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  );
}

/* ------------------------------------------------------------------ */

export function FileBrowser({
  shareId,
  shareName,
  writable,
  initialPath = "",
  embedded = false,
}: {
  shareId: string;
  shareName: string;
  writable: boolean;
  initialPath?: string;
  embedded?: boolean;
}) {
  const [path, setPath] = useState(initialPath);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState("");
  const [serverSearch, setServerSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{ entry: FileEntry; rel: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTargets, setDeleteTargets] = useState<FileEntry[] | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tile, setTile] = useState(TILE_DEFAULT);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const refresh = useRefresh();

  /* ---------- grid tile size (desktop-explorer style zoom) ---------- */
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(TILE_KEY));
    if (saved >= TILE_MIN && saved <= TILE_MAX) setTile(saved);
  }, []);
  const changeTile = (v: number) => {
    const clamped = Math.min(TILE_MAX, Math.max(TILE_MIN, Math.round(v)));
    setTile(clamped);
    window.localStorage.setItem(TILE_KEY, String(clamped));
  };
  const tilePct = Math.round((tile / TILE_DEFAULT) * 100);

  /* ---------- live cross-device transfer activity ---------- */
  const [activity, setActivity] = useState<TransferActivity[]>([]);
  const lastActivityRef = useRef<Map<string, TransferActivity>>(new Map());
  const speedRef = useRef<Map<string, { at: number; bytes: number }>>(new Map());
  const myClientId = useRef<string>("");
  useEffect(() => {
    myClientId.current = getClientId();
  }, []);

  /* ---------- live refresh state ---------- */
  const fingerprintRef = useRef<string>("");
  const pathRef = useRef(path);
  const shareIdRef = useRef(shareId);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);
  useEffect(() => {
    shareIdRef.current = shareId;
  }, [shareId]);

  const load = useCallback(
    async (dir: string, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await Api.browse(shareId, dir);
        setEntries(res.entries);
        fingerprintRef.current = fingerprintOf(res.entries);
      } catch (e) {
        if (!silent) {
          setError((e as Error).message);
          setEntries([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [shareId]
  );

  useEffect(() => {
    setPath(initialPath);
    setSelected(new Set());
    void load(initialPath);
  }, [shareId, initialPath, load]);

  /*
   * Live folder watching:
   *  - Poll a tiny directory fingerprint every 3s (payload is ~100 bytes) and
   *    re-fetch the full listing only when something changed on disk — so
   *    files added from OTHER devices appear without leaving the folder.
   *  - Additionally, the transfer engine pings this browser the moment a
   *    local upload completes, for a truly instant refresh.
   *  - Polling pauses while the tab is hidden or a server search is active.
   */
  const searchActive = searchResults !== null;

  /*
   * Diff the incoming activity snapshot against the previous one:
   *  - remember per-transfer byte counts so a rough cross-poll speed can be
   *    shown for OTHER devices' transfers;
   *  - toast when a remote transfer finishes ("iPhone finished downloading…").
   */
  const applyActivity = useCallback((incoming: TransferActivity[]) => {
    const prev = lastActivityRef.current;
    const now = Date.now();
    const next = new Map<string, TransferActivity>();
    for (const a of incoming) {
      next.set(a.id, a);
      const old = prev.get(a.id);
      if (a.status === "active") {
        if (old) {
          const delta = a.transferred - old.transferred;
          const dt = now - old.updatedAt;
          if (delta > 0 && dt > 0) speedRef.current.set(a.id, { at: now, bytes: delta * 1000 / dt });
        }
      } else if (old && old.status === "active" && a.clientId !== myClientId.current) {
        const verb = a.kind === "upload" ? "uploading" : "downloading";
        if (a.status === "done") {
          toast.success(`${a.device} finished ${verb} “${a.name}”`, {
            icon: a.kind === "upload" ? <ArrowUpFromLine className="size-4" /> : <ArrowDownToLine className="size-4" />,
          });
        } else if (a.status === "failed") {
          toast.warning(`${a.device}'s ${verb} of “${a.name}” failed`, {
            icon: <MonitorSmartphone className="size-4" />,
          });
        }
      }
    }
    speedRef.current.forEach((_, id) => {
      if (!next.has(id)) speedRef.current.delete(id);
    });
    lastActivityRef.current = next;
    setActivity(incoming);
  }, []);

  useEffect(() => {
    fingerprintRef.current = ""; // moving to another folder resets the baseline
    let cancelled = false;
    const tick = async () => {
      if (cancelled || document.visibilityState !== "visible" || searchActive) return;
      try {
        const res = await Api.browseSummary(shareIdRef.current, pathRef.current);
        if (cancelled) return;
        const fp = `${res.summary.count}:${res.summary.size}:${res.summary.latest}`;
        if (fingerprintRef.current && fp !== fingerprintRef.current) {
          fingerprintRef.current = fp;
          await load(pathRef.current, true); // silent refresh — no spinner flicker
        } else {
          fingerprintRef.current = fp;
        }
        if (res.activity) {
          applyActivity(res.activity);
        }
      } catch {
        /* server busy or unreachable — retry on the next tick */
      }
    };
    const t = setInterval(() => void tick(), 3000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shareId, path, searchActive, load, applyActivity]);

  /* Instant refresh when an upload lands in the folder being viewed. */
  useEffect(() => {
    return transfers.onUploadCompleted(({ shareId: sid, dirPath }) => {
      if (sid === shareIdRef.current && dirPath === pathRef.current) {
        void load(pathRef.current, true);
      }
    });
  }, [load]);

  const runServerSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await Api.search(shareId, q, "");
        setSearchResults(res.results);
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [shareId]
  );

  useEffect(() => {
    const t = setTimeout(() => void runServerSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runServerSearch]);

  const visible = useMemo(() => {
    const base = searchResults !== null ? searchResults : entries;
    const q = query.trim().toLowerCase();
    const filtered = searchResults !== null ? base : base.filter((e) => e.name.toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      let cmp = 0;
      if (sort === "name") cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
      else if (sort === "size") cmp = a.size - b.size;
      else cmp = a.modifiedAt - b.modifiedAt;
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [entries, searchResults, query, sort, sortAsc]);

  const joinPath = (dir: string, name: string) => (dir ? `${dir}/${name}` : name);

  const crumbs = useMemo(() => {
    const parts = path ? path.split("/") : [];
    return [{ name: shareName, path: "" }, ...parts.map((p, i) => ({ name: p, path: parts.slice(0, i + 1).join("/") }))];
  }, [path, shareName]);

  /* ---------------- actions ---------------- */

  const openEntry = (entry: FileEntry) => {
    const rel = joinPath(path, entry.name);
    if (entry.kind === "dir") {
      setQuery("");
      setSearchResults(null);
      setPath(rel);
      setSelected(new Set());
      void load(rel);
    } else {
      setPreview({ entry, rel });
    }
  };

  const downloadEntry = (entry: FileEntry) => {
    const rel = joinPath(path, entry.name);
    transfers.enqueueDownload({
      shareId,
      shareName,
      filePath: rel,
      name: entry.name,
      size: entry.size,
    });
    toast.success(`Downloading ${entry.name} — track it in the Transfer Center`, {
      icon: <ArrowDownToLine className="size-4" />,
    });
  };

  const uploadFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    for (const file of list) {
      transfers.enqueueUpload({ shareId, shareName, dirPath: path, file });
    }
    toast.success(
      list.length === 1
        ? `Uploading ${list[0].name}`
        : `Uploading ${list.length} files (${formatBytes(list.reduce((a, f) => a + f.size, 0))})`
    );
  };

  /**
   * Upload a whole FOLDER from this device (browser-native webkitdirectory
   * picker). The tree keeps its structure — subfolders are recreated inside
   * the current directory. Works for guests and the owner alike, on any
   * device — the folder always comes from the device you're holding.
   */
  const uploadFolderFromDevice = async () => {
    const pick = await pickDeviceFolder();
    if (!pick || pick.entries.length === 0) return;
    const base = pick.rootName
      ? joinDirPath(path, pick.rootName)
      : path;
    for (const entry of pick.entries) {
      transfers.enqueueUpload({
        shareId,
        shareName,
        dirPath: joinDirPath(base, entry.relDir),
        file: entry.file,
      });
    }
    const total = pick.entries.reduce((a, e) => a + e.file.size, 0);
    toast.success(
      pick.entries.length === 1
        ? `Uploading ${pick.entries[0].file.name}`
        : `Uploading folder with ${pick.entries.length} files (${formatBytes(total)})`
    );
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await Api.createFolder(shareId, path, name);
      toast.success(`Folder “${name}” created`);
      setNewFolderOpen(false);
      setNewFolderName("");
      await load(path);
      refresh.refreshSystem();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name || name === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    setBusy(true);
    try {
      await Api.renameEntry(shareId, joinPath(path, renameTarget.name), name);
      toast.success("Renamed");
      setRenameTarget(null);
      await load(path);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTargets) return;
    setBusy(true);
    try {
      for (const t of deleteTargets) {
        await Api.deleteEntry(shareId, joinPath(path, t.name));
      }
      toast.success(
        deleteTargets.length === 1
          ? `“${deleteTargets[0].name}” deleted`
          : `${deleteTargets.length} items deleted`
      );
      setDeleteTargets(null);
      setSelected(new Set());
      await load(path);
      refresh.refreshShares();
    } catch (e) {
      toast.error((e as Error).message);
      await load(path);
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (name: string, additive: boolean) => {
    setSelected((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      if (additive && prev.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectedEntries = visible.filter((e) => selected.has(e.name));
  const totalSize = visible.reduce((a, e) => a + e.size, 0);
  const items = useTransfers((s) => s.items);
  const dockItems = selectDockItems(items);
  const dockVisible = dockItems.length > 0;

  /** Files in the current view (preview navigation order). */
  const fileSiblings = useMemo(
    () => visible.filter((e) => e.kind === "file").map((e) => ({ entry: e, rel: joinPath(path, e.name) })),
    [visible, path]
  );

  /** Transfers happening on OTHER devices (active, or just finished). */
  const remoteActivity = useMemo(() => {
    const now = Date.now();
    return activity.filter(
      (a) =>
        a.clientId !== myClientId.current &&
        (a.status === "active" || (a.status !== "canceled" && now - a.updatedAt < 10_000))
    );
  }, [activity]);

  /** Live uploads for this share — current folder first, others after. */
  const activeUploads = useMemo(() => {
    const ups = items.filter(
      (i) => i.kind === "upload" && (i.status === "active" || i.status === "queued")
    );
    return [
      ...ups.filter((i) => i.shareId === shareId && i.path === path),
      ...ups.filter((i) => i.shareId === shareId && i.path !== path),
      ...ups.filter((i) => i.shareId !== shareId),
    ];
  }, [items, shareId, path]);
  const uploadsTotal = activeUploads.reduce((a, i) => a + i.size, 0);
  const uploadsDone = activeUploads.reduce((a, i) => a + i.transferred, 0);
  const uploadsPct = pct(uploadsDone, uploadsTotal);

  return (
    <div
      className={cn("relative flex flex-col", embedded ? "h-full" : "min-h-[60vh]")}
      onDragOver={(e) => {
        e.preventDefault();
        if (writable) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!writable) return;
        if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
      }}
    >
      {/* Toolbar — two slim rows: path/status, then controls. Nothing floats. */}
      <div className="flex items-center gap-2">
        {/* breadcrumbs */}
        <nav aria-label="Breadcrumb" className="ld-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-sm">
          {crumbs.map((c, i) => (
            <span key={c.path} className="flex shrink-0 items-center">
              {i > 0 && <ChevronRight className="mx-0.5 size-3.5 text-muted-foreground/60" />}
              <button
                onClick={() => {
                  setQuery("");
                  setSearchResults(null);
                  setPath(c.path);
                  setSelected(new Set());
                  void load(c.path);
                }}
                className={cn(
                  "max-w-40 truncate rounded-lg px-2 py-1 font-medium transition-colors hover:bg-muted",
                  i === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>

        {/* desktop status cluster */}
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {serverSearch === false && searchResults !== null && (
            <span className="font-medium text-primary">search results</span>
          )}
          {!writable && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">Read only</span>
          )}
          <span className="tnum hidden sm:inline">
            {visible.length} item{visible.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
          </span>
          {!searchActive && (
            <span
              className="hidden items-center gap-1.5 sm:flex"
              title="This folder refreshes automatically"
            >
              <span className="size-1.5 rounded-full bg-success dot-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* controls row — search grows, everything else is a compact icon */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1 sm:max-w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-9 w-full rounded-xl pl-8"
            aria-label="Search files"
          />
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="size-9 shrink-0 rounded-xl"
              aria-label="Sort options"
              title="Sort"
            >
              {sort === "name" ? (
                sortAsc ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />
              ) : (
                sortAsc ? <CalendarArrowUp className="size-4" /> : <CalendarArrowDown className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => { setSort("name"); setSortAsc(true); }}>
              <ArrowUpAZ className="size-4" /> Name (A→Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort("name"); setSortAsc(false); }}>
              <ArrowDownAZ className="size-4" /> Name (Z→A)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort("modified"); setSortAsc(false); }}>
              <CalendarArrowDown className="size-4" /> Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort("modified"); setSortAsc(true); }}>
              <CalendarArrowUp className="size-4" /> Oldest first
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSort("size"); setSortAsc(false); }}>
              <Package className="size-4" /> Largest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSort("size"); setSortAsc(true); }}>
              <Package className="size-4" /> Smallest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex shrink-0 overflow-hidden rounded-xl border border-border">
          <button
            onClick={() => setView("grid")}
            className={cn("p-2 transition-colors", view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
            aria-label="Grid view"
          >
            <Grid2X2 className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-2 transition-colors", view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>

        {/* Explorer-style icon-size zoom — one compact button everywhere,
            opens presets + slider in a popover (fits any narrow screen). */}
        {view === "grid" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-9 shrink-0 rounded-xl"
                aria-label="Icon size"
                title="Icon size"
              >
                <Scaling className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Icon size</span>
                <span className="tnum text-muted-foreground">{tilePct}%</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {TILE_PRESETS.map((p) => (
                  <button
                    key={p.v}
                    onClick={() => changeTile(p.v)}
                    className={cn(
                      "rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition-colors",
                      tile === p.v
                        ? "border-primary/60 bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={TILE_MIN}
                max={TILE_MAX}
                step={8}
                value={tile}
                onChange={(e) => changeTile(Number(e.target.value))}
                className="ld-zoom mt-3 w-full"
                aria-label="Grid icon size"
              />
            </PopoverContent>
          </Popover>
        )}

        {/* core actions — always visible in the toolbar, nothing floating */}
        {writable && (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button size="sm" className="h-9 rounded-xl px-2.5 sm:px-3" onClick={() => uploadRef.current?.click()}>
              <Upload className="size-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-9 rounded-xl"
              onClick={() => void uploadFolderFromDevice()}
              aria-label="Upload folder from this device"
              title="Upload folder from this device"
            >
              <FolderUp className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-9 rounded-xl"
              onClick={() => setNewFolderOpen(true)}
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* mobile status line (desktop shows the same info beside breadcrumbs) */}
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground sm:hidden">
        <span className="tnum">
          {visible.length} item{visible.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
        </span>
        {serverSearch === false && searchResults !== null && (
          <span className="font-medium text-primary">search results</span>
        )}
        {!writable && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-semibold">Read only</span>
        )}
        {!searchActive && (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            <span className="size-1.5 rounded-full bg-success dot-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Live upload tray — slim one-liners, thin bars, zero clutter */}
      {activeUploads.length > 0 && (
        <div className="rise mt-1.5 overflow-hidden rounded-xl border border-primary/25 bg-accent/30">
          <div className="flex items-center gap-2 px-3 pb-1 pt-2">
            <ArrowUpFromLine className="size-3.5 shrink-0 text-primary" />
            <p className="min-w-0 truncate text-xs font-semibold">
              Uploading {activeUploads.length} file{activeUploads.length === 1 ? "" : "s"}
              {" "}
              <span className="font-normal text-muted-foreground">
                to {activeUploads[0].shareId === shareId ? "this shared folder" : activeUploads[0].shareName}
              </span>
            </p>
            <span className="tnum ml-auto shrink-0 text-xs font-bold text-primary">
              {Math.round(uploadsPct)}%
            </span>
          </div>
          <div className="relative mx-3 h-0.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${uploadsPct}%` }}
            />
          </div>
          <div className="space-y-2 px-3 pb-2 pt-1.5">
            {activeUploads.slice(0, 4).map((i) => {
              const p = pct(i.transferred, i.size);
              const inThisFolder = i.shareId === shareId && i.path === path;
              return (
                <div key={i.id}>
                  <div className="flex min-w-0 items-center gap-2 text-[11px]">
                    {i.status === "active" ? (
                      <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    )}
                    <span className="min-w-0 truncate font-medium">{i.name}</span>
                    {!inThisFolder && (
                      <span className="shrink-0 rounded-md bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {i.shareId === shareId ? `/${i.path}` : i.shareName}
                      </span>
                    )}
                    <span className="tnum ml-auto shrink-0 font-semibold">
                      {i.status === "queued" ? "Queued" : `${Math.round(p)}%`}
                      {i.status === "active" && i.speedBps > 0 && (
                        <span className="ml-1 font-normal text-muted-foreground">{formatSpeed(i.speedBps)}</span>
                      )}
                      {i.status === "active" && i.etaSec !== null && (
                        <span className="ml-1 font-normal text-muted-foreground">ETA {formatEta(i.etaSec)}</span>
                      )}
                    </span>
                    <button
                      className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => void transfers.cancel(i.id)}
                      aria-label={`Cancel upload of ${i.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <Progress
                    value={p}
                    className="mt-0.5 h-0.5 overflow-hidden rounded-full"
                    aria-label={`${i.name} upload progress ${Math.round(p)}%`}
                  />
                </div>
              );
            })}
            {activeUploads.length > 4 && (
              <p className="text-[10px] font-medium text-muted-foreground">
                + {activeUploads.length - 4} more — open the Transfer Center for details
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live transfers on OTHER devices — collapsed to one quiet line by
          default ("iPhone · downloading vacation.mp4 · 45%"), tap to expand. */}
      {remoteActivity.length > 0 && (() => {
        const first = remoteActivity[0];
        const firstP = first.size > 0 ? Math.min(100, (first.transferred / first.size) * 100) : first.status === "done" ? 100 : 0;
        const firstVerb = first.kind === "upload" ? "uploading" : "downloading";
        const summary =
          remoteActivity.length === 1
            ? `${first.device} · ${
                first.status === "done"
                  ? `finished ${firstVerb.replace("ing", "")}`
                  : first.status === "failed"
                    ? `failed ${firstVerb}`
                    : `${firstVerb}`
              } ${first.name}${first.status === "active" ? ` · ${Math.round(firstP)}%` : ""}`
            : `${remoteActivity.length} transfers on other devices`;
        return (
          <div className="rise mt-1.5 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
            <button
              type="button"
              onClick={() => setRemoteOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left"
              aria-expanded={remoteOpen || remoteActivity.length === 1}
            >
              <MonitorSmartphone className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{summary}</span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success dot-pulse" />
                live
              </span>
              {remoteActivity.length > 1 && (
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform",
                    remoteOpen && "rotate-180"
                  )}
                />
              )}
            </button>
            {(remoteOpen || remoteActivity.length === 1) && (
              <div className="space-y-2 px-3 pb-2 pt-0.5">
                {remoteActivity.slice(0, 5).map((a) => {
                  const p = a.size > 0 ? Math.min(100, (a.transferred / a.size) * 100) : a.status === "done" ? 100 : 0;
                  const speed = speedRef.current.get(a.id)?.bytes ?? 0;
                  const verb = a.kind === "upload" ? "Uploading" : "Downloading";
                  const inThisFolder = a.kind === "upload" && (a.dirPath ?? "") === path;
                  return (
                    <div key={a.id}>
                      <div className="flex min-w-0 items-center gap-2 text-[11px]">
                        <span
                          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[8px] font-black uppercase text-primary"
                          title={a.device}
                          aria-hidden
                        >
                          {a.device.slice(0, 1)}
                        </span>
                        {a.kind === "upload" ? (
                          <ArrowUpFromLine className="size-3 shrink-0 text-primary" />
                        ) : (
                          <ArrowDownToLine className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 truncate font-medium">
                          <span className="text-muted-foreground">{a.device} · </span>
                          {a.status === "done" ? `${verb.replace("ing", "ed")} ` : a.status === "failed" ? "Failed: " : `${verb} `}
                          {a.name}
                        </span>
                        {!inThisFolder && a.kind === "upload" && (a.dirPath ?? "") !== "" && (
                          <span className="shrink-0 rounded-md bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                            /{a.dirPath}
                          </span>
                        )}
                        <span className="tnum ml-auto shrink-0 font-semibold">
                          {a.status === "done" ? (
                            <span className="text-success">Done</span>
                          ) : a.status === "failed" ? (
                            <span className="text-destructive">Failed</span>
                          ) : (
                            <>
                              {Math.round(p)}%
                              {speed > 0 && (
                                <span className="ml-1 font-normal text-muted-foreground">{formatSpeed(speed)}</span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      {a.status === "active" && (
                        <div className="relative mt-0.5 h-0.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="progress-shimmer h-full rounded-full bg-primary/80 transition-[width] duration-500"
                            style={{ width: `${Math.max(2, p)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {remoteActivity.length > 5 && (
                  <p className="text-[10px] font-medium text-muted-foreground">+ {remoteActivity.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Content — full page scroll on phones, capped nested scroller on desktop */}
      <div className={cn("ld-scroll mt-3 flex-1 overflow-y-auto pb-24", embedded ? "" : "lg:max-h-[62vh]")}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.05] p-5 text-center">
            <p className="text-sm font-semibold text-destructive">Couldn't open this folder</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => void load(path)}>
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 py-16 text-center">
            <FolderPlus className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              {query ? `Nothing matches “${query}”` : "This folder is empty"}
            </p>
            {!query && writable && (
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                Drop files here, upload from the toolbar, or create a folder to organize things.
              </p>
            )}
          </div>
        ) : view === "grid" ? (
          <div
            className="grid gap-2"
            style={
              {
                "--tile": `${tile}px`,
                gridTemplateColumns: `repeat(auto-fill, minmax(${tile}px, 1fr))`,
              } as React.CSSProperties
            }
          >
            {visible.map((entry) => (
              <GridCard
                key={`${entry.kind}:${entry.name}`}
                entry={entry}
                shareId={shareId}
                relPath={joinPath(path, entry.name)}
                selected={selected.has(entry.name)}
                onSelect={(additive) => toggleSelect(entry.name, additive)}
                onOpen={() => openEntry(entry)}
                onDownload={() => downloadEntry(entry)}
                onRename={() => {
                  setRenameTarget(entry);
                  setRenameValue(entry.name);
                }}
                onDelete={() => setDeleteTargets([entry])}
                writable={writable}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-3 py-2.5"></th>
                  <th className="cursor-pointer px-2 py-2.5 font-semibold" onClick={() => { setSort("name"); setSortAsc(sort === "name" ? !sortAsc : true); }}>
                    Name {sort === "name" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="hidden cursor-pointer px-2 py-2.5 font-semibold sm:table-cell" onClick={() => { setSort("size"); setSortAsc(sort === "size" ? !sortAsc : true); }}>
                    Size {sort === "size" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="hidden cursor-pointer px-3 py-2.5 font-semibold md:table-cell" onClick={() => { setSort("modified"); setSortAsc(sort === "modified" ? !sortAsc : true); }}>
                    Modified {sort === "modified" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visible.map((entry) => (
                  <ListRow
                    key={`${entry.kind}:${entry.name}`}
                    entry={entry}
                    shareId={shareId}
                    relPath={joinPath(path, entry.name)}
                    selected={selected.has(entry.name)}
                    onSelect={(additive) => toggleSelect(entry.name, additive)}
                    onOpen={() => openEntry(entry)}
                    onDownload={() => downloadEntry(entry)}
                    onRename={() => {
                      setRenameTarget(entry);
                      setRenameValue(entry.name);
                    }}
                    onDelete={() => setDeleteTargets([entry])}
                    writable={writable}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <input
        ref={uploadRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drag overlay */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-[2px]">
          <div className="rounded-2xl bg-card px-6 py-4 text-center shadow-pop">
            <Upload className="mx-auto size-6 text-primary" />
            <p className="mt-2 text-sm font-semibold">Drop to upload here</p>
          </div>
        </div>
      )}

      {/* Selection bar */}
      {selected.size > 0 && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit rise lg:bottom-6",
            dockVisible && "bottom-20 lg:bottom-24"
          )}
        >
          <div className="flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-foreground text-background shadow-pop px-3 py-2">
            <span className="tnum px-1 text-sm font-semibold">
              {selected.size} selected
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 rounded-xl bg-background/15 text-background hover:bg-background/25"
              onClick={() => {
                for (const entry of selectedEntries) {
                  if (entry.kind === "file") downloadEntry(entry);
                }
              }}
            >
              <FileDown className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            {writable && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 rounded-xl bg-background/15 text-background hover:bg-background/25"
                onClick={() => setDeleteTargets(selectedEntries)}
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="size-8 rounded-xl bg-background/15 text-background hover:bg-background/25"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <PreviewModal
          shareId={shareId}
          shareName={shareName}
          entry={preview.entry}
          relPath={preview.rel}
          siblings={fileSiblings}
          onNavigate={(s) => setPreview(s)}
          onClose={() => setPreview(null)}
          onDownload={() => downloadEntry(preview.entry)}
        />
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(v) => !v && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input" className="sr-only">
              New name
            </Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doRename()}
              autoFocus
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={doRename} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            placeholder="Folder name"
            autoFocus
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder} disabled={busy || !newFolderName.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargets} onOpenChange={(v) => !v && setDeleteTargets(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTargets?.length === 1 ? `“${deleteTargets[0].name}”` : `${deleteTargets?.length} items`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteTargets?.length === 1 ? "it" : "them"} from your
              computer's disk. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void doDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

/* ---------------- item renderers ---------------- */

/**
 * Thumbnail tile for images (sharp) and videos (ffmpeg frame grab).
 * If the server can't generate one (missing binary, unsupported codec, 404)
 * the client renders the thumbnail itself — full-image downscale for photos,
 * a hidden-<video> canvas grab for clips — and the type icon is the very
 * last resort. Generation happens lazily; document folders never ask.
 */
type ThumbPhase = "loading" | "server" | "recovering" | "full" | "frame" | "icon";

async function thumbFallback(
  shareId: string,
  relPath: string,
  category: "image" | "video",
  set: (phase: ThumbPhase, src: string) => void
) {
  markServerMiss(shareId, relPath); // stop re-asking a server that can't do it
  if (category === "image") {
    try {
      set("full", await fullImageSrc(shareId, relPath));
    } catch {
      set("icon", "");
    }
    return;
  }
  const frame = await grabVideoFrame(shareId, relPath);
  set(frame ? "frame" : "icon", frame ?? "");
}

function EntryThumb({
  shareId,
  relPath,
  entry,
  className,
}: {
  shareId: string;
  relPath: string;
  entry: FileEntry;
  className?: string;
}) {
  const thumbable =
    entry.kind === "file" && (entry.category === "image" || entry.category === "video");
  const category = entry.category === "video" ? "video" : "image";
  // Resolved thumbnail, tagged with the path it belongs to — a path change
  // instantly "clears" the tile without any synchronous state reset.
  const [loaded, setLoaded] = useState<{ rel: string; phase: ThumbPhase; src: string } | null>(null);
  const valid =
    loaded &&
    loaded.rel === relPath &&
    (loaded.phase === "server" || loaded.phase === "full" || loaded.phase === "frame")
      ? loaded.src
      : null;
  const busy =
    loaded &&
    loaded.rel === relPath &&
    (loaded.phase === "loading" || loaded.phase === "recovering");

  useEffect(() => {
    if (!thumbable) return;
    let ok = true;
    const set = (phase: ThumbPhase, src: string) => {
      if (ok) setLoaded({ rel: relPath, phase, src });
    };
    const cached = category === "video" ? cachedVideoFrame(shareId, relPath) : undefined;
    if (cached) {
      set("frame", cached);
      return;
    }
    set("loading", "");
    void serverThumb(shareId, relPath, 480).then((r) => {
      if (r.kind === "url") set("server", r.url);
      else void thumbFallback(shareId, relPath, category, set);
    });
    return () => {
      ok = false;
    };
  }, [thumbable, shareId, relPath, category]);

  /* Server thumbnail failed → chain the client-side fallbacks. */
  useEffect(() => {
    if (loaded?.rel !== relPath || loaded.phase !== "recovering") return;
    let ok = true;
    void thumbFallback(shareId, relPath, category, (phase, src) => {
      if (ok) setLoaded({ rel: relPath, phase, src });
    });
    return () => {
      ok = false;
    };
  }, [loaded, relPath, shareId, category]);

  if (!thumbable) return <FileIcon entry={entry} className={className} />;
  if (busy) {
    return (
      <span
        className={cn("shrink-0 animate-pulse overflow-hidden rounded-xl bg-muted/70", className)}
        aria-hidden
      />
    );
  }
  if (!valid) return <FileIcon entry={entry} className={className} />;
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted", className)}>
      <img
        src={valid}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() =>
          setLoaded((l) => {
            if (!l || l.rel !== relPath) return l;
            if (l.phase === "server") return { ...l, phase: "recovering", src: "" };
            if (l.phase === "full" || l.phase === "frame") return { ...l, phase: "icon", src: "" };
            return l;
          })
        }
        className="size-full object-cover"
      />
      {category === "video" && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <Play className="size-3 translate-x-px fill-current" />
          </span>
        </span>
      )}
    </span>
  );
}

function GridCard({
  entry,
  shareId,
  relPath,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  writable,
}: {
  entry: FileEntry;
  shareId: string;
  relPath: string;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  writable: boolean;
}) {
  const canThumb =
    entry.kind === "file" && (entry.category === "image" || entry.category === "video");
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center rounded-xl border p-1.5 text-center transition-all",
        selected
          ? "border-primary bg-accent/50 ring-1 ring-primary/40"
          : "border-border/70 bg-card hover:border-primary/40 hover:shadow-card"
      )}
      onClick={(e) => {
        onSelect(e.ctrlKey || e.metaKey || e.shiftKey);
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) onOpen();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      aria-label={entry.name}
    >
      <span
        className={cn(
          "absolute left-1.5 top-1.5 z-10 size-4 rounded border bg-card transition-opacity",
          selected
            ? "border-primary bg-primary opacity-100"
            : "border-border opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.ctrlKey || e.metaKey);
        }}
        aria-hidden
      />
      {/* Media box scales WITH the zoom slider — the thumbnail itself grows,
          the padding stays fixed. This is the Explorer behaviour. */}
      <span
        className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40"
        style={{ height: "calc(var(--tile) * 0.72)" }}
      >
        <EntryThumb
          entry={entry}
          shareId={shareId}
          relPath={relPath}
          className={
            canThumb
              ? "size-full rounded-lg"
              : "size-[calc(var(--tile)*0.42)] rounded-xl [&>svg]:size-[55%]"
          }
        />
      </span>
      <p
        className="mt-1.5 h-8 w-full break-words px-0.5 text-[11px] font-medium leading-4 line-clamp-2"
        title={entry.name}
      >
        {entry.name}
      </p>
      <p className="pb-0.5 text-[10px] leading-4 text-muted-foreground">
        {entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}
      </p>
      <div className="absolute right-0.5 top-0.5 z-10">
        <RowMenu
          entry={entry}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          writable={writable}
        />
      </div>
    </div>
  );
}

function ListRow({
  entry,
  shareId,
  relPath,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  writable,
}: {
  entry: FileEntry;
  shareId: string;
  relPath: string;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  writable: boolean;
}) {
  const canThumb =
    entry.kind === "file" && (entry.category === "image" || entry.category === "video");
  return (
    <tr
      className={cn("cursor-pointer transition-colors", selected ? "bg-accent/50" : "hover:bg-muted/50")}
      onClick={(e) => {
        onSelect(e.ctrlKey || e.metaKey || e.shiftKey);
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) onOpen();
      }}
    >
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "block size-4 rounded border transition-opacity",
            selected ? "border-primary bg-primary" : "border-border opacity-40"
          )}
        />
      </td>
      <td className="min-w-0 px-2 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <EntryThumb
            entry={entry}
            shareId={shareId}
            relPath={relPath}
            className={canThumb ? "size-9 rounded-lg" : "size-8 shrink-0 [&>svg]:size-4"}
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate font-medium">{entry.name}</span>
            {/* Phones: the Size / Modified columns are hidden, surface them here */}
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground md:hidden">
              <span className="sm:hidden">{entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}</span>
              <span className="hidden sm:inline">{formatDateTime(entry.modifiedAt)}</span>
            </span>
          </div>
        </div>
      </td>
      <td className="tnum hidden px-2 py-2.5 text-xs text-muted-foreground sm:table-cell">
        {entry.kind === "dir" ? "—" : formatBytes(entry.size)}
      </td>
      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
        {formatDateTime(entry.modifiedAt)}
      </td>
      <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
        <RowMenu
          entry={entry}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          writable={writable}
        />
      </td>
    </tr>
  );
}

function RowMenu({
  entry,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  writable,
}: {
  entry: FileEntry;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  writable: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-lg opacity-70 transition-opacity hover:bg-muted focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100"
          aria-label={`Actions for ${entry.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={onOpen}>
          {entry.kind === "dir" ? <Folder className="size-4" /> : <FileIcon entry={entry} className="size-4 [&>svg]:size-4" />}
          Open
        </DropdownMenuItem>
        {entry.kind === "file" && (
          <DropdownMenuItem onClick={onDownload}>
            <ArrowDownToLine className="size-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={async (e) => {
            try {
              await navigator.clipboard.writeText(entry.name);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* noop */
            }
          }}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          Copy name
        </DropdownMenuItem>
        {writable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

