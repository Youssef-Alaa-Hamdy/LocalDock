"use client";

import { useState } from "react";
import { useShares } from "../data-hooks";
import { useNav } from "../nav";
import { FileBrowser } from "../file-browser";
import { EmptyState } from "../empty-state";
import { AddShareDialog } from "../add-share-dialog";
import { cn } from "@/lib/utils";
import { HardDrive, FolderPlus, FolderHeart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function FilesView() {
  const shares = useShares();
  const filesTarget = useNav((s) => s.filesTarget);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const list = shares.data ?? [];
  // Derive the active share: explicit target wins, else remembered choice, else first.
  const desiredId = filesTarget?.shareId ?? activeId;
  const active = list.find((s) => s.id === desiredId) ?? list[0];

  if (shares.isLoading) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    );
  }

  if (!active) {
    return (
      <>
        <EmptyState
          icon={HardDrive}
          title="Nothing to browse yet"
          description={"Files live inside your shared folders.\nAdd a folder and it shows up here instantly."}
          actionLabel="Add Folder"
          onAction={() => setAddOpen(true)}
        />
        <AddShareDialog open={addOpen} onOpenChange={setAddOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* share selector chips */}
      <div className="ld-scroll flex items-center gap-2 overflow-x-auto pb-1">
        {list.map((share) => (
          <button
            key={share.id}
            onClick={() => setActiveId(share.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
              share.id === active.id
                ? "border-primary/60 bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <FolderHeart className={cn("size-4", share.id === active.id && "text-primary")} />
            {share.name}
            <Eye
              className={cn(
                "size-3.5",
                share.access === "read" ? "text-muted-foreground" : "text-primary/70"
              )}
              aria-label={share.access === "read" ? "Read only" : "Read and write"}
            />
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => setAddOpen(true)}
        >
          <FolderPlus className="size-4" />
          Add
        </Button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="shrink-0 rounded-lg font-semibold">
          {active.access === "read" ? "Read only" : "Read & write"}
        </Badge>
        <span className="min-w-0">
          You're browsing <span className="truncate font-medium text-foreground">“{active.name}”</span> on
          your computer — changes appear instantly for all devices.
        </span>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 sm:p-4">
        <FileBrowser
          key={active.id + (filesTarget?.nonce ?? 0)}
          shareId={active.id}
          shareName={active.name}
          writable={active.access === "readwrite"}
          initialPath={filesTarget?.shareId === active.id ? filesTarget.path : ""}
        />
      </div>

      <AddShareDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
