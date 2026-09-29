"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FileEntry } from "@/lib/localdock/types";
import { Api } from "@/lib/localdock/client/api";
import { transfers, useTransfers } from "@/lib/localdock/client/transfer-engine";
import { formatBytes, formatDateTime } from "@/lib/localdock/client/format";
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
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  Check,
  ChevronRight,
  Copy,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  FileQuestion,
  FolderPlus,
  Folder,
  Grid2X2,
  Image as ImageIcon,
  List,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
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

type SortKey = "name" | "size" | "modified";

const CATEGORY_ICONS: Record<string, { icon: typeof FileIcon; tone: string }> = {
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
  const uploadRef = useRef<HTMLInputElement>(null);
  const refresh = useRefresh();

  const load = useCallback(
    async (dir: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await Api.browse(shareId, dir);
        setEntries(res.entries);
      } catch (e) {
        setError((e as Error).message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [shareId]
  );

  useEffect(() => {
    setPath(initialPath);
    setSelected(new Set());
    void load(initialPath);
  }, [shareId, initialPath, load]);

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
  const activeItems = useTransfers((s) => s.items).filter(
    (i) => i.status === "active" || i.status === "queued"
  );

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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-9 w-36 rounded-xl pl-8 sm:w-48"
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
                className="size-9 rounded-xl"
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

          <div className="flex overflow-hidden rounded-xl border border-border">
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
        </div>
      </div>

      {/* info strip */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {visible.length} item{visible.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
        </span>
        {serverSearch === false && searchResults !== null && (
          <span className="font-medium text-primary">search results</span>
        )}
        {!writable && (
          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">Read only</span>
        )}
      </div>

      {/* Content */}
      <div className={cn("ld-scroll mt-3 flex-1 overflow-y-auto pb-24", embedded ? "" : "max-h-[62vh]")}>
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {visible.map((entry) => (
              <GridCard
                key={`${entry.kind}:${entry.name}`}
                entry={entry}
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

      {/* Toolbar (bottom): upload + new folder */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 lg:bottom-6 lg:left-60 lg:justify-end lg:pr-10">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-1.5 shadow-pop backdrop-blur-xl">
          {writable && (
            <>
              <Button size="sm" className="h-9 rounded-xl" onClick={() => uploadRef.current?.click()}>
                <Upload className="size-4" />
                Upload
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl"
                onClick={() => setNewFolderOpen(true)}
              >
                <FolderPlus className="size-4" />
                New folder
              </Button>
            </>
          )}
        </div>
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
        <div className="fixed inset-x-0 bottom-40 z-40 mx-auto w-fit rise lg:bottom-6">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-foreground text-background shadow-pop px-3 py-2">
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
              Download
            </Button>
            {writable && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 rounded-xl bg-background/15 text-background hover:bg-background/25"
                onClick={() => setDeleteTargets(selectedEntries)}
              >
                <Trash2 className="size-4" />
                Delete
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

      {/* active transfer hint */}
      {activeItems.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
          <div className="w-64 rounded-xl border border-border bg-card/95 p-3 shadow-pop backdrop-blur">
            <p className="text-xs font-semibold">
              {activeItems.length} transfer{activeItems.length === 1 ? "" : "s"} in progress
            </p>
            {activeItems.slice(0, 2).map((i) => (
              <div key={i.id} className="mt-1.5">
                <p className="truncate text-[11px] text-muted-foreground">{i.name}</p>
                <Progress value={(i.transferred / Math.max(1, i.size)) * 100} className="mt-1 h-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- item renderers ---------------- */

function GridCard({
  entry,
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  writable,
}: {
  entry: FileEntry;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  writable: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all",
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
          "absolute left-2 top-2 size-4 rounded border transition-opacity",
          selected ? "border-primary bg-primary opacity-100" : "border-border opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.ctrlKey || e.metaKey);
        }}
        aria-hidden
      />
      <FileIcon entry={entry} className="size-12 [&>svg]:size-6" />
      <p className="w-full truncate text-xs font-medium" title={entry.name}>
        {entry.name}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {entry.kind === "dir" ? "Folder" : formatBytes(entry.size)}
      </p>
      <div className="absolute right-1 top-1">
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
  selected,
  onSelect,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  writable,
}: {
  entry: FileEntry;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  writable: boolean;
}) {
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
          <FileIcon entry={entry} className="size-8 shrink-0 [&>svg]:size-4" />
          <span className="truncate font-medium">{entry.name}</span>
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
          className="size-7 rounded-lg opacity-0 transition-opacity hover:bg-muted focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
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

