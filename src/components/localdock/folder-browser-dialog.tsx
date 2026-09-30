"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Api } from "@/lib/localdock/client/api";
import {
  ArrowLeft,
  Check,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Bookmark,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isHostMachine } from "@/lib/localdock/client/host";

interface DirEntry {
  name: string;
  path: string;
  kind?: "drive" | "shortcut" | "dir";
}

/**
 * Computer folder browser dialog.
 * Lets the owner explore the computer's drives and folders to choose a folder.
 */
export function FolderBrowserDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  confirmLabel,
  onSelect,
  requireIndexHtml,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "shares" | "websites";
  title: string;
  description: string;
  confirmLabel: string;
  onSelect: (absPath: string) => void;
  requireIndexHtml?: boolean;
}) {
  const [cwd, setCwd] = useState("");
  const [parent, setParent] = useState<string | null>(null);
  const [dirs, setDirs] = useState<DirEntry[]>([]);
  const [hasIndexHtml, setHasIndexHtml] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(
    async (path: string) => {
      setLoading(true);
      try {
        const res = await Api.fsBrowse(path, mode);
        setCwd(res.cwd);
        setParent(res.parent ?? null);
        setDirs(res.dirs);
        setHasIndexHtml(!!res.hasIndexHtml);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    if (open) {
      setCwd("");
      setParent(null);
      setFilter("");
      setNewName("");
      void load("");
    }
  }, [open, load]);

  const visible = dirs.filter((d) =>
    d.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  const canConfirm = requireIndexHtml ? hasIndexHtml : !!cwd;

  const createFolder = async () => {
    const name = newName.trim();
    if (!name) return;
    if (!cwd) {
      toast.error("Please enter a drive or folder first before creating a subfolder.");
      return;
    }
    setCreating(true);
    try {
      await Api.fsCreate(cwd, name, mode);
      toast.success(`Folder “${name}” created`);
      setNewName("");
      await load(cwd);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const getItemIcon = (kind?: string) => {
    if (kind === "drive") return <HardDrive className="size-4 shrink-0 text-amber-500" />;
    if (kind === "shortcut") return <Bookmark className="size-4 shrink-0 text-blue-500" />;
    return <FolderOpen className="size-4 shrink-0 text-primary" />;
  };

  // Companion devices see the HOST computer's drives here. That is only
  // intuitive on the machine running LocalDock — warn everyone else and
  // point them to the device-upload flow.
  const remoteDevice = !isHostMachine();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-2xl border border-border">
          {remoteDevice && (
            <p className="border-b border-border bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning-foreground">
              These are the drives of the computer running LocalDock. To add folders from THIS
              device, use “Add Folder” in Shares — it uploads from your device instead.
            </p>
          )}
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg px-2"
              disabled={!cwd || loading}
              onClick={() => {
                void load(parent ?? "");
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {cwd ? (
                <span className="font-mono text-xs">{cwd}</span>
              ) : (
                <span className="text-muted-foreground">💻 This PC (Drives & Folders)</span>
              )}
            </span>
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="border-b border-border px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter folders…"
                className="h-9 rounded-xl border-none bg-transparent pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="ld-scroll max-h-[38vh] min-h-44 overflow-y-auto p-2 sm:max-h-64">
            {visible.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FolderOpen className="size-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {filter ? "No folders match your filter." : "This folder is empty."}
                </p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {visible.map((d) => (
                  <li key={d.path}>
                    <button
                      onClick={() => void load(d.path)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/60"
                    >
                      {getItemIcon(d.kind)}
                      <span className="truncate font-medium">{d.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cwd && (
            <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-3 py-2.5">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                placeholder="New folder name…"
                className="h-9 flex-1 rounded-xl"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl"
                disabled={!newName.trim() || creating}
                onClick={createFolder}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FolderPlus className="size-4" />
                )}
                Create
              </Button>
            </div>
          )}
        </div>

        {requireIndexHtml && !canConfirm && (
          <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            Select a folder that contains an{" "}
            <code className="font-mono font-semibold">index.html</code> file.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={cn(!canConfirm && "pointer-events-none opacity-50")}
            onClick={() => {
              onSelect(cwd);
              onOpenChange(false);
            }}
          >
            <Check className="size-4" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
