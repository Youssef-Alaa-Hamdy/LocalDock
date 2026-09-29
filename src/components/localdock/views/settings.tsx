"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSystem, useDevices, useActivity, useRefresh } from "../data-hooks";
import { useNav } from "../nav";
import { Api } from "@/lib/localdock/client/api";
import { formatBytes, formatSpeed } from "@/lib/localdock/client/format";
import { StatusDot, LogoMark } from "../primitives";
import { Desktop, desktopMode } from "@/lib/localdock/client/desktop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Laptop,
  ShieldCheck,
  ServerCog,
  Network,
  HardDrive,
  ScrollText,
  Loader2,
  Check,
  MonitorSmartphone,
  Eye,
  Wifi,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { LocalDockSettings } from "@/lib/localdock/types";

export function SettingsView() {
  const system = useSystem();
  const devices = useDevices();
  const activity = useActivity(60);
  const refresh = useRefresh();
  const { theme, setTheme } = useTheme();
  const go = useNav((s) => s.go);
  const [settings, setSettings] = useState<LocalDockSettings | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings", {
          headers: { "X-LocalDock-Owner": (await import("@/lib/localdock/client/api")).getOwnerKey() ?? "" },
          cache: "no-store",
        });
        const body = (await res.json()) as { settings?: LocalDockSettings };
        if (body.settings) {
          setSettings(body.settings);
          setName(body.settings.serverName);
        }
      } catch {
        /* non-fatal */
      }
    })();
  }, []);

  const save = async (patch: Partial<LocalDockSettings>, quiet = false) => {
    setSaving(true);
    try {
      const res = await Api.updateSettings(patch);
      setSettings(res.settings);
      // Desktop shell: keep the real Windows registry entry in sync.
      if (typeof patch.startWithWindows === "boolean") {
        await Desktop.setStartWithWindows(patch.startWithWindows);
      }
      if (!quiet) toast.success("Settings saved");
      refresh.refreshSystem();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="rounded-2xl bg-muted/70 p-1">
        <TabsTrigger value="general" className="rounded-xl">
          <SettingsIcon className="size-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security" className="rounded-xl">
          <ShieldCheck className="size-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="system" className="rounded-xl">
          <ServerCog className="size-4" />
          System
        </TabsTrigger>
      </TabsList>

      {/* ---------------- General ---------------- */}
      <TabsContent value="general" className="mt-5 space-y-4">
        <SectionCard
          icon={<Laptop className="size-4" />}
          title="Your computer's identity"
          desc="How your cloud appears to other devices on the network."
        >
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="server-name" className="text-xs font-semibold">
                  Server name
                </Label>
                <Input
                  id="server-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  placeholder="My PC"
                />
              </div>
              <Button
                className="rounded-xl"
                disabled={saving || !name.trim() || name === settings?.serverName}
                onClick={() => save({ serverName: name })}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Devices will see this name when pairing and browsing shares.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          icon={<MonitorSmartphone className="size-4" />}
          title="Appearance"
          desc="Light, dark, or follow your system."
        >
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  void save({ theme: t }, true);
                }}
                className={cn(
                  "rounded-2xl border p-3 text-sm font-medium capitalize transition-all",
                  theme === t
                    ? "border-primary/60 bg-accent/50 text-accent-foreground"
                    : "border-border hover:bg-muted"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={<Laptop className="size-4" />}
          title="Windows startup"
          desc="Start LocalDock silently when this computer boots, so your cloud is always on."
        >
          <label className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div className="pr-3">
              <p className="text-sm font-semibold">Start with Windows</p>
              <p className="text-xs text-muted-foreground">
                Applies when running the LocalDock desktop app on Windows.
              </p>
            </div>
            <Switch
              checked={settings?.startWithWindows ?? false}
              onCheckedChange={(v) => save({ startWithWindows: v })}
            />
          </label>
        </SectionCard>
      </TabsContent>

      {/* ---------------- Security ---------------- */}
      <TabsContent value="security" className="mt-5 space-y-4">
        <div className="rise rounded-3xl border border-success/25 bg-success/[0.05] p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-success/15 text-success">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Local Network Only</p>
              <p className="text-sm text-muted-foreground">
                Your services never touch the internet. No cloud, no accounts, no tracking.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Trusted devices" value={`${devices.data?.length ?? 0}`} />
            <MiniStat label="Guest shares" value={
              `${(system.data ? 0 : 0)}` === "0" ? "—" : "—"
            } />
            <MiniStat label="Server" value={system.data?.online ? "Online" : "Offline"} ok={system.data?.online} />
          </div>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => go("devices")}>
            <Eye className="size-4" />
            Manage devices
          </Button>
        </div>

        <SectionCard
          icon={<ServerCog className="size-4" />}
          title="Owner console"
          desc="Controls who may open this dashboard and manage the server."
        >
          <label className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div className="pr-3">
              <p className="text-sm font-semibold">Allow dashboard from any LAN device</p>
              <p className="text-xs text-muted-foreground">
                Off = only this computer can manage shares and devices (desktop app default).
              </p>
            </div>
            <Switch
              checked={settings?.allowRemoteOwner ?? true}
              onCheckedChange={(v) => save({ allowRemoteOwner: v })}
            />
          </label>
        </SectionCard>

        <SectionCard
          icon={<ShieldCheck className="size-4" />}
          title="Built-in protections"
          desc="Always on, nothing to configure."
        >
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Safe-by-default sharing (Read Only, no guests)",
              "Secure device pairing with single-use codes",
              "Per-share permissions & device allow-lists",
              "Path-traversal & filename attack protection",
              "SHA-256 verification of transferred files",
              "One-click device revocation",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </TabsContent>

      {/* ---------------- System ---------------- */}
      <TabsContent value="system" className="mt-5 space-y-4">
        <SectionCard
          icon={<ServerCog className="size-4" />}
          title="Status"
          desc="A live look under the hood."
        >
          {system.isLoading || !system.data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <StatusRow label="Server" value="Online" ok />
              <StatusRow label="Network" value={system.data.network.length > 0 ? `${system.data.network.length} interface(s)` : "Local only"} ok={system.data.network.length > 0} />
              <StatusRow label="Storage" value={`${formatBytes(system.data.storage.freeBytes)} free`} ok />
              <StatusRow label="Transfers" value={formatSpeed(system.data.transferSpeedBps)} />
              <StatusRow label="Devices" value={`${system.data.devicesOnline} online / ${system.data.devicesTrusted} trusted`} />
              <StatusRow label="Platform" value={system.data.platform} />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<Network className="size-4" />}
          title="Network addresses"
          desc="Where your cloud can be reached on this network."
        >
          <div className="space-y-2">
            {(system.data?.network ?? []).map((nic) => (
              <div key={`${nic.name}-${nic.address}`} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
                <Wifi className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{nic.name}</span>
                <code className="ml-auto rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                  {nic.address}
                </code>
              </div>
            ))}
            {(system.data?.network ?? []).length === 0 && (
              <p className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm text-muted-foreground">
                No external interfaces detected — the server is reachable from this machine only.
              </p>
            )}
            <div className="flex items-start gap-2 rounded-xl bg-muted/50 px-3.5 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Your computer advertises itself automatically on the local network. Devices never
              need these addresses — pairing and QR codes handle it. The desktop shell adds
              “localdock.local” name resolution (mDNS).
            </div>
          </div>
        </SectionCard>

        {desktopMode() && (
          <SectionCard
            icon={<MonitorSmartphone className="size-4" />}
            title="Windows app"
            desc="The LocalDock desktop shell is managing this server."
          >
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                Closing this window keeps the server running in the system tray.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                “Start with Windows” controls the real registry entry.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                The server announces itself via mDNS on your network.
              </li>
            </ul>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => void Desktop.openInBrowser()}
            >
              <Eye className="size-4" />
              Open in your default browser
            </Button>
          </SectionCard>
        )}

        <SectionCard
          icon={<ScrollText className="size-4" />}
          title="Activity log"
          desc="The last 60 events, newest first."
        >
          <div className="ld-scroll max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {(activity.data ?? []).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/60">
                <StatusDot ok pulse={false} className="bg-primary/70" />
                <span className="min-w-0 flex-1 truncate text-foreground/90">{entry.message}</span>
                <code className="shrink-0 text-[10px] text-muted-foreground">{entry.type}</code>
              </div>
            ))}
            {(activity.data ?? []).length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Nothing logged yet.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={<HardDrive className="size-4" />}
          title="Storage location"
          desc="Where LocalDock keeps shares, sites and metadata."
        >
          <div className="space-y-1.5 rounded-xl bg-muted/50 p-3.5 font-mono text-xs text-muted-foreground">
            <p><span className="font-semibold text-foreground">LocalDock home:</span> ./localdock</p>
            <p><span className="font-semibold text-foreground">Shares:</span> localdock/Shares/*</p>
            <p><span className="font-semibold text-foreground">Websites:</span> localdock/Websites/*</p>
            <p><span className="font-semibold text-foreground">Registry:</span> localdock/data/*.json</p>
          </div>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/60 text-accent-foreground">
          {icon}
        </span>
        <div>
          <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-xl bg-background/70 px-3.5 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="tnum mt-0.5 flex items-center gap-1.5 text-sm font-bold">
        {ok !== undefined && <StatusDot ok={ok} />}
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {ok !== undefined && <StatusDot ok={ok} />}
        {value}
      </span>
    </div>
  );
}
