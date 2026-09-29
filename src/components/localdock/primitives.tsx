"use client";

import { HardDrive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Animated status indicator used everywhere in LocalDock. */
export function StatusDot({
  ok,
  className,
  pulse = true,
}: {
  ok: boolean;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        ok ? "bg-success text-success" : "bg-muted-foreground/40 text-transparent",
        ok && pulse && "dot-pulse",
        className
      )}
      aria-hidden
    />
  );
}

export function LiveBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <StatusDot ok={ok} />
      {label}
    </span>
  );
}

/** LocalDock logomark — a docked "L" tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="4" y="4" width="56" height="56" rx="16" className="fill-primary" />
      <path d="M20 40V26h6v14h10v6H20Z" className="fill-primary-foreground" />
      <rect x="38" y="18" width="6" height="14" rx="2" className="fill-primary-foreground" opacity="0.85" />
    </svg>
  );
}

/**
 * Desktop-only: opens the real Windows folder picker.
 * Rendered as the primary selection card inside Add Share / Host Website
 * when the app runs under the Tauri shell.
 */
export function NativePickCard({
  title,
  sub,
  busy,
  onClick,
}: {
  title: string;
  sub: string;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="card-lift flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border px-4 py-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30 disabled:opacity-60"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <HardDrive className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {busy && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
