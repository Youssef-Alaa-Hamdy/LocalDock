"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/** LocalDock's signature empty states: calm, friendly, actionable. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rise flex w-full min-w-0 max-w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/60 px-4 py-10 text-center sm:px-6 sm:py-14",
        className
      )}
    >
      <div className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/60 text-accent-foreground">
        <Icon className="size-6" strokeWidth={1.8} />
      </div>
      <h3 className="max-w-full break-words text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-sm break-words text-xs leading-relaxed text-muted-foreground whitespace-pre-line sm:text-sm">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-6 flex items-center gap-2.5">
          {actionLabel && (
            <Button onClick={onAction} className="rounded-xl">
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button variant="outline" onClick={onSecondary} className="rounded-xl">
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
