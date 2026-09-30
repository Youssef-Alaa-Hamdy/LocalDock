"use client";

import { useState } from "react";
import { useWebsites, useRefresh } from "../data-hooks";
import { EmptyState } from "../empty-state";
import { FolderBrowserDialog } from "../folder-browser-dialog";
import { QrDialog } from "../qr-dialog";
import { NativePickCard } from "../primitives";
import { desktopMode, pickNativeFolder } from "@/lib/localdock/client/desktop";
import { Api } from "@/lib/localdock/client/api";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/localdock/client/format";
import { buildLanUrl } from "@/lib/localdock/client/lan";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Globe,
  Plus,
  ExternalLink,
  QrCode,
  Loader2,
  Trash2,
  Copy,
  Check,
  FolderOpen,
  Power,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/localdock/i18n";
import type { Website } from "@/lib/localdock/types";

export function WebsitesView() {
  const { t } = useI18n();
  const websites = useWebsites();
  const refresh = useRefresh();
  const [hostOpen, setHostOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Website | null>(null);
  const [qrFor, setQrFor] = useState<Website | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = async (site: Website) => {
    try {
      await Api.updateWebsite(site.id, { enabled: !site.enabled });
      refresh.refreshWebsites();
      refresh.refreshActivity();
      toast.success(site.enabled ? t.websitesView.stoppedToast(site.name) : t.websitesView.liveToast(site.name));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!removeTarget) return;
    try {
      await Api.deleteWebsite(removeTarget.id);
      toast.success(t.websitesView.removedToast);
      refresh.refreshWebsites();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemoveTarget(null);
    }
  };

  const siteUrl = (site: Website) =>
    buildLanUrl(`/sites/${site.slug}`);

  const friendly = (site: Website) => `${site.slug}.localdock.local`;

  const copyUrl = async (site: Website) => {
    try {
      await navigator.clipboard.writeText(siteUrl(site));
      setCopied(site.id);
      toast.success(t.websitesView.copiedToast);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(t.websitesView.copyFailToast);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{t.websitesView.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.websitesView.subtitle}
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setHostOpen(true)}>
          <Plus className="size-4" />
          {t.websitesView.host}
        </Button>
      </div>

      {websites.isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (websites.data ?? []).length === 0 ? (
        <EmptyState
          icon={Globe}
          title={t.websitesView.emptyTitle}
          description={t.websitesView.emptyDesc}
          actionLabel={t.websitesView.host}
          onAction={() => setHostOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {(websites.data ?? []).map((site, idx) => (
            <div
              key={site.id}
              className={cn(
                "card-lift rise flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card",
                `rise-${Math.min(idx + 1, 4)}`
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                  site.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}
              >
                <Globe className="size-5" strokeWidth={1.8} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-semibold tracking-tight">{site.name}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      site.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {site.enabled ? (
                      <>
                        <span className="size-1.5 rounded-full bg-success dot-pulse" /> {t.websitesView.live}
                      </>
                    ) : (
                      <>
                        <span className="size-1.5 rounded-full bg-muted-foreground/50" /> {t.websitesView.stopped}
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <code dir="ltr" className="rounded bg-muted/60 px-1.5 py-0.5 font-mono">{friendly(site)}</code>
                  <span>· {t.websitesView.hostedAgo(timeAgo(site.createdAt))}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="me-1 flex items-center gap-1.5">
                  <Switch
                    checked={site.enabled}
                    onCheckedChange={() => toggle(site)}
                    aria-label={site.enabled ? t.websitesView.stopAria : t.websitesView.startAria}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 rounded-xl"
                  disabled={!site.enabled}
                  onClick={() => window.open(siteUrl(site), "_blank")}
                >
                  <ExternalLink className="size-4" />
                  {t.websitesView.open}
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => copyUrl(site)}>
                  {copied === site.id ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl"
                  onClick={() => setQrFor(site)}
                  aria-label={t.websitesView.qrAria}
                >
                  <QrCode className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRemoveTarget(site)}
                  aria-label={t.websitesView.removeAria}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HostWebsiteDialog open={hostOpen} onOpenChange={setHostOpen} />

      {qrFor && (
        <QrDialog
          open={!!qrFor}
          onOpenChange={() => setQrFor(null)}
          title={t.websitesView.qrTitle(qrFor.name)}
          description={t.websitesView.qrHint}
          qrUrl={`/api/qr?text=${encodeURIComponent(siteUrl(qrFor))}`}
          link={siteUrl(qrFor)}
        />
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.websitesView.removeTitle(removeTarget?.name ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.websitesView.removeDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void remove()}
            >
              <Trash2 className="size-4" />
              {t.websitesView.removeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HostWebsiteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<"pick" | "configure" | "done">("pick");
  const [pickedPath, setPickedPath] = useState("");
  /** Absolute OS path when the folder came from the native picker (desktop). */
  const [pickedAbs, setPickedAbs] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [browserOpen, setBrowserOpen] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [hosting, setHosting] = useState(false);
  const [hosted, setHosted] = useState<Website | null>(null);
  const refresh = useRefresh();
  const desktop = desktopMode();

  const reset = () => {
    setStep("pick");
    setPickedPath("");
    setPickedAbs(null);
    setManualPath("");
    setName("");
    setSlug("");
    setHosted(null);
    setBrowserOpen(false);
  };

  const nameFromPath = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? "";

  const pickNative = async () => {
    setPicking(true);
    try {
      const abs = await pickNativeFolder(t.websitesView.pickerTitle);
      if (abs) {
        setPickedAbs(abs);
        setPickedPath("");
        setName(nameFromPath(abs));
        setStep("configure");
      } else if (!desktop) {
        setBrowserOpen(true);
      }
    } finally {
      setPicking(false);
    }
  };

  const host = async () => {
    setHosting(true);
    try {
      const res = await Api.hostWebsite({
        name: name.trim() || nameFromPath(pickedAbs ?? pickedPath) || t.websitesView.websiteFallback,
        ...(pickedAbs ? { absPath: pickedAbs } : { homeDirRel: pickedPath }),
        slug: slug.trim() || undefined,
      });
      setHosted(res.website);
      setStep("done");
      refresh.refreshWebsites();
      refresh.refreshActivity();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setHosting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          {step === "pick" && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{t.websitesView.dialogTitle}</DialogTitle>
                <DialogDescription>
                  {t.websitesView.dialogDesc}
                </DialogDescription>
              </DialogHeader>

              <NativePickCard
                title={t.websitesView.pickTitle}
                sub={t.websitesView.pickSub}
                busy={picking}
                onClick={() => void pickNative()}
              />

              <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-semibold text-foreground">{t.websitesView.orPath}</p>
                <div className="flex gap-2">
                  <Input
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    placeholder={t.websitesView.pathPlaceholder}
                    dir="ltr"
                    className="rounded-xl font-mono text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && manualPath.trim()) {
                        setPickedAbs(manualPath.trim());
                        setName(nameFromPath(manualPath.trim()));
                        setStep("configure");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="shrink-0 rounded-xl"
                    disabled={!manualPath.trim()}
                    onClick={() => {
                      setPickedAbs(manualPath.trim());
                      setName(nameFromPath(manualPath.trim()));
                      setStep("configure");
                    }}
                  >
                    {t.common.continue}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl gap-2"
                onClick={() => setBrowserOpen(true)}
              >
                {t.websitesView.browse}
              </Button>
            </div>
          )}

        {step === "configure" && (
          <>
            <DialogHeader>
              <DialogTitle>{t.websitesView.nameTitle}</DialogTitle>
              <DialogDescription>
                {t.websitesView.nameHint}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <FolderOpen className="size-4 shrink-0 text-primary" />
                <span dir="ltr" className="min-w-0 flex-1 truncate text-muted-foreground">
                  {pickedAbs ?? `Websites/${pickedPath}`}
                </span>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setStep("pick")}
                  aria-label={t.websitesView.nameAria}
                >
                  {t.websitesView.nameChange}
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-name" className="text-xs font-semibold">
                  {t.websitesView.websiteName}
                </Label>
                <Input
                  id="site-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.websitesView.namePlaceholder}
                  className="rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-slug" className="text-xs font-semibold">
                  {t.websitesView.addressLabel}
                </Label>
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <input
                    id="site-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder={t.websitesView.addressPlaceholder}
                    dir="ltr"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                  <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">{t.websitesView.addressSuffix}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("pick")}>
                {t.common.back}
              </Button>
              <Button onClick={host} disabled={hosting}>
                {hosting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Power className="size-4" />
                )}
                {t.websitesView.hostVerb}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && hosted && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                </span>
                {t.websitesView.successTitle}
              </DialogTitle>
              <DialogDescription>
                {t.websitesView.successBody(hosted.name)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3.5">
              <Globe className="size-4 shrink-0 text-success" />
              <code dir="ltr" className="min-w-0 flex-1 truncate text-sm font-medium">
                /sites/{hosted.slug}
              </code>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.common.done}
              </Button>
              <Button onClick={() => window.open(`/sites/${hosted.slug}`, "_blank")}>
                <ExternalLink className="size-4" />
                {t.websitesView.openSite}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    <FolderBrowserDialog
      open={browserOpen}
      onOpenChange={setBrowserOpen}
      mode="websites"
      title={t.websitesView.dialogTitle}
      description={t.websitesView.pickStepDesc}
      confirmLabel={t.common.continue}
      requireIndexHtml
      onSelect={(abs) => {
        setPickedAbs(abs);
        setPickedPath("");
        setName(nameFromPath(abs));
        setBrowserOpen(false);
        setStep("configure");
      }}
    />
  </>
  );
}
