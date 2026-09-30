"use client";

import type { TransferItem } from "@/lib/localdock/types";
import { formatBytes, formatEta, formatSpeed, pct } from "@/lib/localdock/client/format";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CircleAlert,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { transfers } from "@/lib/localdock/client/transfer-engine";
import { useI18n } from "@/lib/localdock/i18n";

/** One live transfer row — shared by the dock and the Transfer Center. */
export function TransferRow({
  item,
  compact = false,
}: {
  item: TransferItem;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const percent = pct(item.transferred, item.size);
  const active = item.status === "active";
  const done = item.status === "completed";
  const failed = item.status === "failed";
  const paused = item.status === "paused";
  const queued = item.status === "queued";
  const needsFile = paused && item.kind === "upload" && !item.file;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "rise rounded-2xl border border-border/80 bg-card p-3.5 transition-colors",
          failed && "border-destructive/30 bg-destructive/[0.04]",
          done && "border-success/25"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
              active && "bg-primary/10 text-primary",
              done && "bg-success/10 text-success",
              failed && "bg-destructive/10 text-destructive",
              (paused || queued) && "bg-muted text-muted-foreground",
              item.status === "canceled" && "bg-muted text-muted-foreground"
            )}
          >
            {active ? (
              <Loader2 className="size-4 animate-spin" />
            ) : done ? (
              <Check className="size-4" strokeWidth={2.5} />
            ) : failed ? (
              <CircleAlert className="size-4" />
            ) : needsFile ? (
              <FileQuestion className="size-4" />
            ) : item.kind === "upload" ? (
              <ArrowUpFromLine className="size-4" />
            ) : (
              <ArrowDownToLine className="size-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold leading-tight">{item.name}</p>
              <span
                className={cn(
                  "tnum shrink-0 text-xs font-semibold",
                  failed && "text-destructive",
                  done && "text-success"
                )}
              >
                {done
                  ? formatBytes(item.size)
                  : `${formatBytes(item.transferred)} / ${formatBytes(item.size)}`}
              </span>
            </div>

            <div className="relative mt-2">
              <Progress
                value={percent}
                className={cn(
                  "h-1.5 overflow-hidden rounded-full",
                  active && "progress-shimmer relative",
                  failed && "[&>div]:bg-destructive",
                  done && "[&>div]:bg-success"
                )}
                aria-label={t.transferRow.progressAria(item.name, Math.round(percent))}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-medium text-muted-foreground">
                {active && (
                  <>
                    <span className="tnum font-semibold text-foreground">
                      {formatSpeed(item.speedBps)}
                    </span>
                    {item.etaSec !== null && (
                      <span> · {t.transferRow.eta(formatEta(item.etaSec))}</span>
                    )}
                    {(item.connections ?? 0) > 1 && (
                      <span className="font-semibold text-primary">
                        {" "}· {t.transferRow.links(item.connections ?? 0)}
                      </span>
                    )}
                  </>
                )}
                {queued && t.transferRow.queued}
                {paused && (item.error ?? t.transferRow.paused)}
                {failed && (item.error ?? t.transferRow.failed)}
                {done &&
                  (item.hashHex ? t.transferRow.verified : t.transferRow.completed)}
                {item.status === "canceled" && t.transferRow.canceled}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {item.shareName}
              </span>
            </div>

            {needsFile && (
              <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-transform hover:scale-[1.02]">
                <Play className="size-3.5 rtl:-scale-x-100" />
                {t.transferRow.pickFile}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = transfers.reattachUpload(item.id, f);
                      if (!r.ok) import("sonner").then(({ toast }) => toast.error(r.reason));
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {!compact && (
            <div className="flex shrink-0 items-center gap-1">
              {active && (
                <ActionBtn label={t.transferRow.pause} onClick={() => transfers.pause(item.id)}>
                  <Pause className="size-4" />
                </ActionBtn>
              )}
              {paused && !needsFile && (
                <ActionBtn label={t.transferRow.resume} onClick={() => transfers.resume(item.id)}>
                  <Play className="size-4" />
                </ActionBtn>
              )}
              {failed && (
                <ActionBtn label={t.transferRow.retry} onClick={() => transfers.retry(item.id)}>
                  <RotateCcw className="size-4" />
                </ActionBtn>
              )}
              {item.status !== "canceled" && item.status !== "completed" && (
                <ActionBtn label={t.transferRow.cancel} onClick={() => void transfers.cancel(item.id)} danger>
                  <X className="size-4" />
                </ActionBtn>
              )}
              {(done || item.status === "canceled") && (
                <ActionBtn label={t.transferRow.dismiss} onClick={() => transfers.dismiss(item.id)}>
                  <X className="size-4" />
                </ActionBtn>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function ActionBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const { rtl } = useI18n();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          className={cn(
            "size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
            danger && "hover:bg-destructive/10 hover:text-destructive"
          )}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={rtl ? "right" : "left"} className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
