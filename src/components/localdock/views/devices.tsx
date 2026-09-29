"use client";

import { useCallback, useEffect, useState } from "react";
import { Api } from "@/lib/localdock/client/api";
import { useDevices, useRefresh } from "../data-hooks";
import { EmptyState } from "../empty-state";
import { QrDialog } from "../qr-dialog";
import { timeAgo } from "@/lib/localdock/client/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  QrCode,
  Plus,
  ScanLine,
  Loader2,
  ShieldOff,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import type { Device } from "@/lib/localdock/types";

function platformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("android")) return Smartphone;
  if (p.includes("ios") || p.includes("iphone") || p.includes("ipad")) return Tablet;
  if (p.includes("web") || p.includes("browser")) return Monitor;
  return Laptop;
}

export function AddDeviceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api.pairStart();
      setQrUrl(res.qrUrl);
      setCode(res.code);
      setClaimUrl(res.claimUrl);
      setExpiresAt(res.expiresAt);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void start();
  }, [open, start]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const expired = expiresAt !== null && remaining <= 0;

  return (
    <QrDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Device"
      description={
        expired
          ? "This code has expired — generate a fresh one."
          : "Open LocalDock on your phone, choose “Scan QR”, and point the camera here."
      }
      qrUrl={qrUrl ?? "/api/qr?text=loading"}
      link={claimUrl}
      expiresInSec={expired ? 0 : remaining}
    />
  );
}

/* ------------------------------------------------------------------ */

export function DevicesView({ onPairSuccess }: { onPairSuccess?: () => void }) {
  const devices = useDevices();
  const refresh = useRefresh();
  const [addOpen, setAddOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<(Device & { online: boolean }) | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const claim = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    try {
      const name =
        navigator.platform || navigator.userAgent.includes("Android")
          ? "This browser"
          : "This browser";
      const res = await Api.pairClaim({
        code,
        deviceName: `${name}`,
        platform: /android/i.test(navigator.userAgent)
          ? "android"
          : /iphone|ipad/i.test(navigator.userAgent)
            ? "ios"
            : "web",
      });
      const { saveDeviceToken } = await import("@/lib/localdock/client/api");
      saveDeviceToken(res.deviceToken);
      toast.success(`Paired with “${res.server.serverName}” — you're a trusted device now`);
      setManualCode("");
      onPairSuccess?.();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await Api.revokeDevice(revokeTarget.id);
      toast.success(`“${revokeTarget.name}” can no longer access this computer`);
      refresh.refreshDevices();
      refresh.refreshSystem();
      refresh.refreshActivity();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Devices</h2>
          <p className="text-sm text-muted-foreground">
            Trusted devices allowed to reach your shares.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setAddOpen(true)}>
          <QrCode className="size-4" />
          Add Device
        </Button>
      </div>

      {/* Pair via code (for devices without a camera) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card p-3.5 shadow-card">
        <ScanLine className="size-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          No camera? Enter the 6-character code shown on the computer:
        </p>
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-center font-mono text-sm font-bold uppercase tracking-[0.25em]"
          aria-label="Pairing code"
        />
        <Button size="sm" variant="outline" className="rounded-xl" onClick={claim} disabled={!manualCode.trim()}>
          Pair
        </Button>
      </div>

      {devices.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (devices.data ?? []).length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No devices paired yet"
          description={"Scan the QR with your phone once.\nAfter that, your phone and this computer recognize each other automatically."}
          actionLabel="Show QR Code"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(devices.data ?? []).map((device, idx) => {
            const Icon = platformIcon(device.platform);
            return (
              <div
                key={device.id}
                className={cn(
                  "card-lift rise flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card",
                  `rise-${Math.min(idx + 1, 4)}`
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/70 text-accent-foreground">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{device.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {device.online ? (
                      <>
                        <Wifi className="size-3 text-success" />
                        <span className="font-medium text-success">Online now</span>
                      </>
                    ) : (
                      <>Last seen {timeAgo(device.lastSeenAt)}</>
                    )}
                    <span>· paired {timeAgo(device.pairedAt)}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRevokeTarget(device)}
                >
                  <ShieldOff className="size-4" />
                  Revoke
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!revokeTarget} onOpenChange={(v) => !v && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke “{revokeTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The device loses access to every share immediately. It can be paired again anytime
              with a fresh QR code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void revoke()}
              disabled={revoking}
            >
              {revoking ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
              Revoke device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
