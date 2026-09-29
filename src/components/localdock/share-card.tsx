"use client";

import { useState, useEffect } from "react";
import type { Device, Share } from "@/lib/localdock/types";
import { Api } from "@/lib/localdock/client/api";
import { useRefresh } from "./data-hooks";
import { useNav } from "./nav";
import { QrDialog } from "./qr-dialog";
import { formatBytes } from "@/lib/localdock/client/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  Check,
  FolderHeart,
  FolderOpen,
  Loader2,
  QrCode,
  Settings2,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

/** Share card + its manage sheet (access, guest, devices, danger zone). */
export function ShareCard({ share, className }: { share: Share; className?: string }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const openFiles = useNav((s) => s.openFiles);

  const link = typeof window !== "undefined" ? `${location.origin}/?s=${share.slug}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied — anyone on your network can open it");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <>
      <div
        className={cn(
          "card-lift group flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-card",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/70 text-accent-foreground">
            <FolderHeart className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-tight">{share.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(share.sizeBytes)} · {share.itemCount} items
            </p>
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
            aria-label={`Manage ${share.name}`}
          >
            <Settings2 className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge ok>{share.access === "read" ? "Read only" : "Read & write"}</Badge>
          <Badge ok={share.guestEnabled}>
            {share.guestEnabled ? "Guest link on" : "Devices only"}
          </Badge>
        </div>

        <code className="mt-3 block truncate rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          /?s={share.slug}
        </code>

        <div className="mt-3.5 flex items-center gap-1.5">
          <Button size="sm" className="h-8 flex-1 rounded-xl" onClick={() => openFiles(share.id, "")}>
            <FolderOpen className="size-4" />
            Open
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={copy}>
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl"
            onClick={() => setQrOpen(true)}
            aria-label="Show QR"
          >
            <QrCode className="size-4" />
          </Button>
        </div>
      </div>

      <QrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        title={`Share “${share.name}”`}
        description="Scan with any device on this network — or send the link."
        qrUrl={`/api/qr?text=${encodeURIComponent(link)}`}
        link={link}
      />

      <ShareManageDialog share={share} open={manageOpen} onOpenChange={setManageOpen} />
    </>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        ok ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function ShareManageDialog({
  share,
  open,
  onOpenChange,
}: {
  share: Share;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState(share.name);
  const [access, setAccess] = useState<"read" | "readwrite">(share.access);
  const [guest, setGuest] = useState(share.guestEnabled);
  const [deviceMode, setDeviceMode] = useState<"all" | "custom">(
    share.allowedDevices === "all" ? "all" : "custom"
  );
  const [selected, setSelected] = useState<string[]>(
    share.allowedDevices === "all" ? [] : share.allowedDevices
  );
  const [devices, setDevices] = useState<(Device & { online: boolean })[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = useRefresh();

  // load devices when the dialog opens
  useEffect(() => {
    if (!open) return;
    void Api.devices()
      .then((res) => setDevices(res.devices))
      .catch(() => undefined);
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await Api.updateShare(share.id, {
        name: name.trim() || share.name,
        access,
        guestEnabled: guest,
        allowedDevices: deviceMode === "all" ? "all" : selected,
      });
      toast.success("Sharing settings updated");
      refresh.refreshShares();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await Api.deleteShare(share.id);
      toast.success("Stopped sharing — files stay untouched on disk");
      refresh.refreshShares();
      refresh.refreshSystem();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              Manage “{share.name}”
            </DialogTitle>
            <DialogDescription>
              Who can see this folder, and what they can do with it.
            </DialogDescription>
          </DialogHeader>

          <div className="ld-scroll max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="m-name" className="text-xs font-semibold">
                Name
              </Label>
              <div className="flex items-center gap-2">
                <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Access</Label>
              <RadioGroup value={access} onValueChange={(v) => setAccess(v as "read" | "readwrite")}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3",
                    access === "readwrite" ? "border-primary/60 bg-accent/40" : "border-border"
                  )}
                >
                  <RadioGroupItem value="readwrite" id="m-rw" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Read & Write</p>
                    <p className="text-xs text-muted-foreground">Browse, download, upload, organize.</p>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3",
                    access === "read" ? "border-primary/60 bg-accent/40" : "border-border"
                  )}
                >
                  <RadioGroupItem value="read" id="m-ro" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Read Only</p>
                    <p className="text-xs text-muted-foreground">Browse and download only.</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-border p-3">
              <div className="pr-3">
                <p className="text-sm font-semibold">Guest browser access</p>
                <p className="text-xs text-muted-foreground">Shareable link, no pairing needed.</p>
              </div>
              <Switch checked={guest} onCheckedChange={setGuest} />
            </label>

            <div className="space-y-2.5">
              <Label className="text-xs font-semibold">Device access</Label>
              <RadioGroup
                value={deviceMode}
                onValueChange={(v) => setDeviceMode(v as "all" | "custom")}
              >
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <RadioGroupItem value="all" id="dev-all" />
                  <span className="text-sm">All trusted devices</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <RadioGroupItem value="custom" id="dev-custom" />
                  <span className="text-sm">Only specific devices</span>
                </label>
              </RadioGroup>

              {deviceMode === "custom" && (
                <div className="ld-scroll max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2">
                  {devices.length === 0 && (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No paired devices yet.
                    </p>
                  )}
                  {devices.map((d) => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={selected.includes(d.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) =>
                            v ? [...prev, d.id] : prev.filter((id) => id !== d.id)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{d.name}</span>
                      <span className="text-[11px] text-muted-foreground">{d.platform}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-3.5">
              <p className="text-sm font-semibold">Stop sharing</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Removes the share everywhere. Files on disk are never touched.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-2.5 rounded-xl"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Stop sharing this folder
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop sharing “{share.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              All devices and guest links lose access immediately. The folder and its files stay
              exactly where they are on your computer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep sharing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void remove()}
            >
              Stop sharing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
