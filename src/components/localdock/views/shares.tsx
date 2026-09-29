"use client";

import { useShares } from "../data-hooks";
import { useNav } from "../nav";
import { EmptyState } from "../empty-state";
import { AddShareDialog } from "../add-share-dialog";
import { ShareCard } from "../share-card";
import { FolderHeart, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function SharesView() {
  const shares = useShares();
  const [addOpen, setAddOpen] = useState(false);
  const go = useNav((s) => s.go);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Shares</h2>
          <p className="text-sm text-muted-foreground">
            Every folder you've made available on your network.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setAddOpen(true)}>
          <FolderPlus className="size-4" />
          Add Share
        </Button>
      </div>

      {shares.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (shares.data ?? []).length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title="No shared folders yet"
          description={"Your computer can become your personal local cloud.\nAdd your first folder — it takes ten seconds."}
          actionLabel="Add Folder"
          onAction={() => setAddOpen(true)}
          secondaryLabel="Pair a device"
          onSecondary={() => go("devices")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(shares.data ?? []).map((share, idx) => (
            <ShareCard key={share.id} share={share} className={`rise rise-${Math.min(idx + 1, 4)}`} />
          ))}
        </div>
      )}

      <AddShareDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
