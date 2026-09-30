"use client";

import { useSystem, useShares, useActivity, useDevices, useRefresh } from "../data-hooks";
import { useNav } from "../nav";
import { EmptyState } from "../empty-state";
import { StatusDot } from "../primitives";
import { AddShareDialog } from "../add-share-dialog";
import { formatBytes, formatSpeed, greeting, timeAgo } from "@/lib/localdock/client/format";
import { useI18n } from "@/lib/localdock/i18n/provider";
import { activityMessage } from "@/lib/localdock/i18n/activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  FolderHeart,
  HardDrive,
  Laptop,
  Globe,
  ShieldCheck,
  FileUp,
  FileDown,
  FolderPlus,
  LaptopMinimalCheck,
  Globe as GlobeIcon,
  Trash2,
  Pencil,
  FolderTree,
  Ban,
  ServerCog,
} from "lucide-react";
import type { ActivityEntry } from "@/lib/localdock/types";
import { useState } from "react";

export function DashboardView() {
  const { t } = useI18n();
  const system = useSystem();
  const shares = useShares();
  const activity = useActivity(14);
  const devices = useDevices();
  const go = useNav((s) => s.go);
  const openFiles = useNav((s) => s.openFiles);
  const [addOpen, setAddOpen] = useState(false);

  const online = system.data?.online ?? false;
  const topShares = (shares.data ?? []).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* ---------- Hero ---------- */}
      <section className="rise relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold">
              <StatusDot ok={online} />
              {online ? t.dashboard.heroOnline : t.dashboard.heroReconnect}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t.dashboard.heroPrivacy}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {t.dashboard.greetingLine(greeting())}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t.dashboard.heroBody(shares.data?.length ?? 0, system.data?.devicesOnline ?? 0)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Laptop className="size-4" />}
              label={t.dashboard.statDevices}
              value={t.dashboard.statOnline(system.data?.devicesOnline ?? 0)}
              sub={t.dashboard.statTrusted(system.data?.devicesTrusted ?? 0)}
              loading={system.isLoading}
              onClick={() => go("devices")}
            />
            <Stat
              icon={<HardDrive className="size-4" />}
              label={t.dashboard.statShared}
              value={formatBytes(system.data?.sharedBytes ?? 0)}
              sub={t.dashboard.statShares(shares.data?.length ?? 0)}
              loading={system.isLoading}
              onClick={() => go("shares")}
            />
            <Stat
              icon={<ArrowUpRight className="size-4" />}
              label={t.dashboard.statTransfer}
              value={formatSpeed(system.data?.transferSpeedBps ?? 0)}
              sub={t.dashboard.liveSpeed}
              loading={system.isLoading}
            />
            <Stat
              icon={<ShieldCheck className="size-4" />}
              label={t.dashboard.statSecurity}
              value={t.dashboard.localOnly}
              sub={t.dashboard.noCloud}
              loading={system.isLoading}
              onClick={() => go("settings")}
            />
          </div>
        </div>
      </section>

      {/* ---------- Shares ---------- */}
      <section aria-label={t.dashboard.sharesAria}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">{t.dashboard.sharesTitle}</h2>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => go("shares")}>
            {t.dashboard.allShares} <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>

        {shares.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : topShares.length === 0 ? (
          <EmptyState
            icon={FolderHeart}
            title={t.dashboard.emptyTitle}
            description={t.dashboard.emptyDesc}
            actionLabel={t.dashboard.addFolder}
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {topShares.map((share, idx) => (
              <button
                key={share.id}
                onClick={() => openFiles(share.id, "")}
                className={`card-lift rise rise-${Math.min(idx + 1, 4)} group rounded-2xl border border-border/70 bg-card p-4 text-start shadow-card`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent/70 text-accent-foreground transition-transform group-hover:scale-105">
                    <FolderHeart className="size-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{share.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(share.sizeBytes)} · {share.access === "read" ? t.dashboard.readOnly : t.dashboard.readWrite}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <StatusDot ok pulse={false} className="bg-success" />
                    {t.dashboard.shared}
                  </span>
                  <span>{share.guestEnabled ? t.dashboard.guestOn : t.dashboard.devicesOnly}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Quick actions + Activity ---------- */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-base font-bold tracking-tight">{t.dashboard.quickActions}</h2>
          <div className="grid gap-2.5">
            <QuickAction
              icon={FolderPlus}
              title={t.dashboard.qaAdd}
              desc={t.dashboard.qaAddDesc}
              onClick={() => setAddOpen(true)}
            />
            <QuickAction
              icon={LaptopMinimalCheck}
              title={t.dashboard.qaPair}
              desc={t.dashboard.qaPairDesc}
              onClick={() => go("devices")}
            />
            <QuickAction
              icon={GlobeIcon}
              title={t.dashboard.qaSite}
              desc={t.dashboard.qaSiteDesc}
              onClick={() => go("websites")}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight">{t.dashboard.recentActivity}</h2>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => go("settings")}>
              <Activity className="size-4" /> {t.dashboard.system}
            </Button>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card shadow-card">
            {activity.isLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : (activity.data ?? []).length === 0 ? (
              <div className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Activity className="size-4" />
                {t.dashboard.activityEmpty}
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {(activity.data ?? []).slice(0, 7).map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <AddShareDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-2xl border border-border/70 bg-background/60 p-3.5 text-start backdrop-blur transition-all ${
        onClick ? "card-lift cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-20 rounded-lg" />
      ) : (
        <p className="tnum mt-1.5 text-lg font-bold tracking-tight">{value}</p>
      )}
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Comp>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof Globe;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-lift group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 text-start shadow-card"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/70 text-accent-foreground transition-transform group-hover:scale-105">
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </button>
  );
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; tone: string }> = {
  "file.uploaded": { icon: FileUp, tone: "bg-primary/10 text-primary" },
  "file.downloaded": { icon: FileDown, tone: "bg-primary/10 text-primary" },
  "share.created": { icon: FolderPlus, tone: "bg-accent text-accent-foreground" },
  "share.updated": { icon: Pencil, tone: "bg-muted text-muted-foreground" },
  "share.deleted": { icon: Trash2, tone: "bg-muted text-muted-foreground" },
  "device.paired": { icon: LaptopMinimalCheck, tone: "bg-success/10 text-success" },
  "device.revoked": { icon: Ban, tone: "bg-destructive/10 text-destructive" },
  "website.hosted": { icon: GlobeIcon, tone: "bg-success/10 text-success" },
  "website.stopped": { icon: GlobeIcon, tone: "bg-muted text-muted-foreground" },
  "website.removed": { icon: Trash2, tone: "bg-muted text-muted-foreground" },
  "file.renamed": { icon: Pencil, tone: "bg-muted text-muted-foreground" },
  "file.deleted": { icon: Trash2, tone: "bg-muted text-muted-foreground" },
  "file.created": { icon: FolderTree, tone: "bg-muted text-muted-foreground" },
  "security.denied": { icon: ShieldCheck, tone: "bg-warning/15 text-warning-foreground" },
  "server.started": { icon: ServerCog, tone: "bg-success/10 text-success" },
  "transfer.failed": { icon: ArrowDownToLine, tone: "bg-destructive/10 text-destructive" },
};

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const { t } = useI18n();
  const conf = ACTIVITY_ICONS[entry.type] ?? ACTIVITY_ICONS["file.uploaded"];
  const Icon = conf.icon;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${conf.tone}`}>
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm">{activityMessage(entry, t.activity)}</p>
      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(entry.at)}</span>
    </li>
  );
}
