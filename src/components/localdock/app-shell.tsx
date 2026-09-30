"use client";

import { useSyncExternalStore, useEffect } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/localdock/i18n/provider";
import { LOCALE_LIST, LOCALES, type Locale } from "@/lib/localdock/i18n/locales";
import { useNav, type ViewKey } from "./nav";
import { useSystem, useRefresh } from "./data-hooks";
import { setLanIp } from "@/lib/localdock/client/lan";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  FolderHeart,
  Gauge,
  HardDrive,
  Laptop,
  LayoutDashboard,
  Languages,
  Moon,
  ArrowLeftRight,
  Settings,
  Sun,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NAV: { key: ViewKey; labelKey: "dashboard" | "shares" | "files" | "transfers" | "devices" | "websites" | "settings"; icon: typeof Gauge }[] = [
  { key: "dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { key: "shares", labelKey: "shares", icon: FolderHeart },
  { key: "files", labelKey: "files", icon: HardDrive },
  { key: "transfers", labelKey: "transfers", icon: ArrowLeftRight },
  { key: "devices", labelKey: "devices", icon: Laptop },
  { key: "websites", labelKey: "websites", icon: Globe },
  { key: "settings", labelKey: "settings", icon: Settings },
];

export function AppShell({ onPairSuccess }: { onPairSuccess?: () => void }) {
  const { t, locale, setLocale } = useI18n();
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

  // keep server-side activity + share stats fresh when transfers complete
  useEffect(() => {
    const completed = items.filter((i) => i.status === "completed").length;
    if (completed > 0) {
      refresh.refreshActivity();
      refresh.refreshShares();
    }
     
  }, [items.reduce((acc, i) => acc + (i.status === "completed" ? 1 : 0), 0)]);

  // Keep the injected LAN IP fresh from the /api/system poll (every 4s), so
  // share links / QR codes survive DHCP address changes mid-session.
  useEffect(() => {
    if (system.data?.lanIp) setLanIp(system.data.lanIp);
  }, [system.data?.lanIp]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-border/70 bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <LogoMark className="size-9 rounded-xl shadow-card" />
          <div>
            <div className="text-[15px] font-bold tracking-tight">LocalDock</div>
            <div className="text-[11px] font-medium text-muted-foreground">
              {t.brand.tagline}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label={t.nav.main}>
          {NAV.map((item) => {
            const active = view === item.key;
            const label = t.nav[item.labelKey];
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
                <span className="flex-1 text-start">{label}</span>
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
                {system.data?.serverName ?? t.settings.server}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <StatusDot ok={online} />
                {online ? t.status.online : t.status.offline}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="tnum text-lg font-bold tracking-tight">
                {globalSpeed > 0 ? formatSpeed(globalSpeed) : "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">{t.status.currentTransfer}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">{t.brand.localOnly ?? ""}</span>
            {mounted && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={t.status.toggleTheme}
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
      <div className="flex min-h-screen w-full flex-col lg:ps-60">
        {/* Topbar — desktop keeps the roomy bar; phones get ONE slim row */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          {/* Desktop */}
          <div className="hidden items-center gap-3 px-6 py-3 lg:flex">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight">
                {t.nav[NAV.find((n) => n.key === view)?.labelKey ?? "dashboard"]}
              </h1>
            </div>
            <div className="ms-auto flex items-center gap-2">
              {system.isLoading ? (
                <Skeleton className="h-8 w-36 rounded-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <Pill
                    ok={online}
                    icon={<StatusDot ok={online} />}
                    label={online ? t.status.serverOnline : t.status.serverOffline}
                  />
                  <Pill
                    ok={online}
                    icon={<Laptop className="size-3.5 text-muted-foreground" />}
                    label={t.status.devices(system.data?.devicesOnline ?? 0)}
                  />
                  <Pill
                    ok={online}
                    icon={<HardDrive className="size-3.5 text-muted-foreground" />}
                    label={t.status.shares(system.data?.sharesCount ?? 0)}
                  />
                </div>
              )}
              <LanguageMenu locale={locale} setLocale={setLocale} ariaLabel={t.settings.languageTitle} />
            </div>
          </div>

          {/* Mobile — a single compact row: brand + icon tabs + actions (~48px
              total instead of the old two-deck header) */}
          <div className="flex items-center gap-1 px-2 py-1.5 lg:hidden">
            <LogoMark className="size-7 shrink-0 rounded-lg" />
            <nav className="flex min-w-0 flex-1 items-center justify-around" aria-label={t.nav.mobile}>
              {NAV.slice(0, 6).map((item) => {
                const active = view === item.key;
                const label = t.nav[item.labelKey];
                return (
                  <button
                    key={item.key}
                    onClick={() => go(item.key)}
                    className={cn(
                      "relative flex items-center justify-center rounded-lg p-2 transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    title={label}
                  >
                    <item.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                    {item.key === "transfers" && activeCount > 0 && (
                      <span className="absolute end-0 top-0.5 flex min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold leading-none text-primary-foreground">
                        {activeCount}
                      </span>
                    )}
                    {active && (
                      <span className="absolute -bottom-0.5 size-1 rounded-full bg-primary" aria-hidden />
                    )}
                  </button>
                );
              })}
            </nav>
            {mounted && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-lg"
                  onClick={() => go("settings")}
                  aria-label={t.nav.settings}
                >
                  <Settings className="size-4" />
                </Button>
                <LanguageMenu
                  locale={locale}
                  setLocale={setLocale}
                  ariaLabel={t.settings.languageTitle}
                  className="size-8 shrink-0 rounded-lg"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-lg"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label={t.status.toggleTheme}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-3 pb-24 pt-3 sm:px-6 sm:pt-5 lg:pb-10">
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

/**
 * Quick language switcher — renders every registered locale automatically,
 * so future languages appear here without touching this component.
 */
function LanguageMenu({
  locale,
  setLocale,
  ariaLabel,
  className,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn("size-8 rounded-lg", className)}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
        {LOCALE_LIST.map((l) => {
          const meta = LOCALES[l];
          return (
            <DropdownMenuItem
              key={l}
              onClick={() => setLocale(l)}
              className={cn(locale === l && "bg-accent/60")}
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="block text-sm font-semibold">{meta.nativeName}</span>
                <span className="block text-[11px] text-muted-foreground">{meta.name}</span>
              </span>
              {locale === l && <Check className="size-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
