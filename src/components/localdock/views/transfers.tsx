"use client";

import { useTransfers } from "@/lib/localdock/client/transfer-engine";
import { TransferRow } from "../transfer-row";
import { EmptyState } from "../empty-state";
import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { formatSpeed } from "@/lib/localdock/client/format";

const SECTIONS: {
  title: string;
  hint: string;
  test: (s: string) => boolean;
}[] = [
  { title: "Active", hint: "Moving right now", test: (s) => s === "active" || s === "queued" },
  { title: "Paused", hint: "Resume anytime", test: (s) => s === "paused" },
  { title: "Completed", hint: "Verified & done", test: (s) => s === "completed" },
  { title: "Failed", hint: "One click to retry", test: (s) => s === "failed" || s === "canceled" },
];

export function TransfersView() {
  const items = useTransfers((s) => s.items);
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const totalActiveSpeed = items
    .filter((i) => i.status === "active")
    .reduce((acc, i) => acc + i.speedBps, 0);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transfers yet"
        description={
          "Upload something from your phone or download a file here.\nLive progress will show up in this center."
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalActiveSpeed > 0 ? (
            <>
              Moving at{" "}
              <span className="tnum font-semibold text-foreground">
                {formatSpeed(totalActiveSpeed)}
              </span>{" "}
              on your local network
            </>
          ) : (
            "Everything is settled."
          )}
        </p>
        {items.some((i) => ["completed", "canceled"].includes(i.status)) && (
          <span className="text-xs text-muted-foreground">
            {items.filter((i) => i.status === "completed").length} completed this session
          </span>
        )}
      </div>

      {SECTIONS.map((section) => {
        const list = sorted.filter((i) => section.test(i.status));
        if (list.length === 0) return null;
        return (
          <section key={section.title} aria-label={section.title}>
            <div className="mb-2.5 flex items-baseline gap-2">
              <h2 className="text-sm font-bold tracking-tight">{section.title}</h2>
              <span className="tnum text-xs text-muted-foreground">{list.length}</span>
              <span className="text-xs text-muted-foreground">· {section.hint}</span>
            </div>
            <div className="space-y-2">
              {list.map((item) => (
                <TransferRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      {items.every((i) => i.status === "completed") && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-success/25 bg-success/[0.06] py-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          All transfers completed successfully
        </div>
      )}
    </div>
  );
}
