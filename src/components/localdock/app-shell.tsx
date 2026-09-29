"use client";

import { useSyncExternalStore, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNav, type ViewKey } from "./nav";
import { useSystem, useRefresh } from "./data-hooks";
import { useTransfers, selectActiveCount } from "@/lib/localdock/client/transfer-engine";
import { StatusDot, LogoMark } from "./primitives";
import { TransferDock } from "./transfer-dock";
import { DashboardView } from "./views/dashboard";
import { SharesView } from "./views/shares";
import { FilesView } from "./views/files";
import { TransfersView } from "./views/transfers";
import { DevicesView } from "./views/devices";
import { WebsitesView } from "./views/websites";
import { SettingsView } from "./views/settings";
import { cn } from "@/lib/utils";
import { formatSpeed } from "@/lib/localdock/client/format";
import {
  FolderHeart,
  Gauge,
  HardDrive,
  Laptop,
  LayoutDashboard,
  Moon,
  ArrowLeftRight,
  Settings,
  Sun,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NAV: { key: ViewKey; label: string; icon: typeof Gauge }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "shares", label: "Shares", icon: FolderHeart },
  { key: "files", label: "Files", icon: HardDrive },
  { key: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { key: "devices", label: "Devices", icon: Laptop },
  { key: "websites", label: "Websites", icon: Globe },
  { key: "settings", label: "Settings", icon: Settings },
];

export function AppShell({ onPairSuccess }: { onPairSuccess?: () => void }) {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const system = useSystem();
  const items = useTransfers((s) => s.items);
  const activeCount = selectActiveCount(items);
  const globalSpeed = items
    .filter((i) => i.status === "active")
    .reduce((acc, i) => acc + i.speedBps, 0);
  const { theme, setTheme } = useTheme();
  // hydration-safe "mounted" flag without setState-in-effect
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const online = system.data?.online ?? false;
  const refresh = useRefresh();

  // keep server-side activity fresh when transfers complete
  useEffect(() => {
    const completed = items.filter((i) => i.status === "completed").length;
    if (completed > 0) refresh.refreshActivity();
     
  }, [items.reduce((acc, i) => acc + (i.status === "completed" ? 1 : 0), 0)]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/70 bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <LogoMark className="size-9 rounded-xl shadow-card" />
          <div>
            <div className="text-[15px] font-bold tracking-tight">LocalDock</div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Personal Local Cloud
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {NAV.map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-[18px] transition-transform group-hover:scale-105",
                    active && "text-primary"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === "transfers" && activeCount > 0 && (
                  <span className="tnum rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border/70 p-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {system.data?.serverName ?? "Server"}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <StatusDot ok={online} />
                {online ? "Online" : "Offline"}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="tnum text-lg font-bold tracking-tight">
                {globalSpeed > 0 ? formatSpeed(globalSpeed) : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">current transfer</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">Local network only</span>
            {mounted && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {/* Mobile brand + nav */}
            <div className="flex items-center gap-2 lg:hidden">
              <LogoMark className="size-8 rounded-lg" />
              <span className="text-sm font-bold tracking-tight">LocalDock</span>
            </div>

            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-[15px] font-semibold tracking-tight">
                {NAV.find((n) => n.key === view)?.label}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {system.isLoading ? (
                <Skeleton className="h-8 w-36 rounded-full" />
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Pill
                    ok={online}
                    icon={<StatusDot ok={online} />}
                    label={online ? "Server online" : "Server offline"}
                  />
                  <Pill
                    ok={online}
                    icon={<Laptop className="size-3.5 text-muted-foreground" />}
                    label={`${system.data?.devicesOnline ?? 0} device${
                      (system.data?.devicesOnline ?? 0) === 1 ? "" : "s"
                    }`}
                  />
                  <Pill
                    ok={online}
                    icon={<HardDrive className="size-3.5 text-muted-foreground" />}
                    label={`${system.data?.sharesCount ?? 0} shares`}
                  />
                </div>
              )}
              {mounted && (
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9 rounded-xl lg:hidden"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile bottom-tab nav */}
          <nav
            className="flex items-center justify-around border-t border-border/60 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 lg:hidden"
            aria-label="Mobile"
          >
            {NAV.slice(0, 6).map((item) => {
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.key)}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            {view === "dashboard" && <DashboardView />}
            {view === "shares" && <SharesView />}
            {view === "files" && <FilesView />}
            {view === "transfers" && <TransfersView />}
            {view === "devices" && <DevicesView onPairSuccess={onPairSuccess} />}
            {view === "websites" && <WebsitesView />}
            {view === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      <TransferDock />
    </div>
  );
}

function Pill({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border/70 bg-card px-3 text-xs font-medium shadow-sm">
      {icon}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
