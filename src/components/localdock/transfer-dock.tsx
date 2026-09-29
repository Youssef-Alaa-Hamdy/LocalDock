"use client";

import { useState } from "react";
import {
  useTransfers,
  selectActiveCount,
  selectDockItems,
} from "@/lib/localdock/client/transfer-engine";
import { useNav } from "./nav";
import { TransferRow } from "./transfer-row";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSpeed, pct } from "@/lib/localdock/client/format";
import { Button } from "@/components/ui/button";

/** Floating mini transfer center — lives quietly, becomes visible when needed. */
export function TransferDock() {
  const items = useTransfers((s) => s.items);
  const connected = useTransfers((s) => s.connected);
  const [expanded, setExpanded] = useState(false);
  const go = useNav((s) => s.go);

  const active = items.filter(
    (i) => i.status === "active" || i.status === "queued"
  );
  // One shared definition of "dock-worthy" items — the Files tab uses the
  // same selector to stack the upload toolbar above this dock without overlaps.
  const visibleItems = selectDockItems(items);
  if (visibleItems.length === 0) return null;

  const speed = active.reduce((acc, i) => acc + i.speedBps, 0);
  const totalBytes = visibleItems.reduce((a, i) => a + i.size, 0);
  const doneBytes = visibleItems.reduce((a, i) => a + i.transferred, 0);
  const overall = pct(doneBytes, totalBytes);
  const activeCount = selectActiveCount(items);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "fixed inset-x-3 bottom-20 z-40 mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-pop backdrop-blur-xl lg:inset-x-auto lg:right-6 lg:bottom-6 lg:mx-0",
        !connected && "border-warning/50"
      )}
      role="region"
      aria-label="Active transfers"
    >
      {/* div (not button): it contains interactive controls — nested buttons are invalid HTML */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
        }}
      >
        <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ArrowLeftRight className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              {active.length > 0
                ? `Transferring ${visibleItems.length} item${visibleItems.length === 1 ? "" : "s"}`
                : "Attention needed"}
            </span>
            <span className="tnum text-xs font-semibold text-muted-foreground">
              {speed > 0 ? formatSpeed(speed) : ""}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
            className="border-t border-border/70"
          >
            <div className="ld-scroll max-h-72 space-y-2 overflow-y-auto p-3">
              {visibleItems.map((item) => (
                <TransferRow key={item.id} item={item} compact />
              ))}
              <Button
                variant="ghost"
                className="w-full rounded-xl text-xs font-semibold text-muted-foreground"
                onClick={() => {
                  go("transfers");
                  setExpanded(false);
                }}
              >
                Open Transfer Center
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
