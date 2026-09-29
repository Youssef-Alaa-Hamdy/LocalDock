"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FolderBrowserDialog } from "./folder-browser-dialog";
import { Api } from "@/lib/localdock/client/api";
import { useRefresh } from "./data-hooks";
import { NativePickCard } from "./primitives";
import { isDesktop, pickNativeFolder } from "@/lib/localdock/client/desktop";
import {
  Check,
  FolderOpen,
  FolderSearch,
  HardDrive,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { QrDialog } from "./qr-dialog";
import { buildLanUrl } from "@/lib/localdock/client/lan";
import type { Share } from "@/lib/localdock/types";

interface ShortcutItem {
  name: string;
  path: string;
  kind?: "drive" | "shortcut" | "dir";
}

/**
 * Add Share flow:
 * Select real folder from computer -> Name -> Permissions -> Share.
 * Works with any real path on the computer (e.g. D:\Downloads, C:\Users\...).
 */
export function AddShareDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState<"pick" | "configure" | "done">("pick");
  const [pickedAbs, setPickedAbs] = useState<string>("");
  const [manualPath, setManualPath] = useState("");
  const [picking, setPicking] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [name, setName] = useState("");
  const [access, setAccess] = useState<"read" | "readwrite">("readwrite");
  const [guest, setGuest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Share | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const refresh = useRefresh();
  const desktop = isDesktop();

  useEffect(() => {
    if (open) {
      setStep("pick");
      setPickedAbs("");
      setManualPath("");
      setName("");
      setAccess("readwrite");
      setGuest(false);
      setCreated(null);
      setQrOpen(false);
      setBrowserOpen(false);

      // Fetch real system shortcuts & drives
      void Api.fsBrowse("", "shares")
        .then((res) => {
          if (res?.dirs) setShortcuts(res.dirs);
        })
        .catch(() => undefined);
    }
  }, [open]);

  const nameFromPath = (p: string) => {
    const clean = p.replace(/[\\/]+$/, "");
    return clean.split(/[\\/]/).filter(Boolean).pop() ?? "Shared folder";
  };

  const choosePath = (absPath: string) => {
    const clean = absPath.trim().replace(/^["']|["']$/g, "");
    if (!clean) return;
    setPickedAbs(clean);
    setName(nameFromPath(clean));
    setStep("configure");
  };

  const pickNative = async () => {
    setPicking(true);
    try {
      const abs = await pickNativeFolder("Choose a folder to share");
      if (abs) {
        choosePath(abs);
      } else if (!desktop) {
        setBrowserOpen(true);
      }
    } catch (e) {
      toast.error("Could not open native folder picker: " + (e as Error).message);
    } finally {
      setPicking(false);
    }
  };

  const create = async () => {
    if (!pickedAbs) {
      toast.error("Please choose a folder to share.");
      return;
    }
    setCreating(true);
    try {
      const res = await Api.createShare({
        name: name.trim() || nameFromPath(pickedAbs) || "Shared folder",
        absPath: pickedAbs,
        access,
        guestEnabled: guest,
      });
      setCreated(res.share);
      setStep("done");
      refresh.refreshShares();
      refresh.refreshActivity();
      refresh.refreshSystem();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {step === "pick" && (
            <>
              <DialogHeader>
                <DialogTitle>Add Folder to Share</DialogTitle>
                <DialogDescription>
                  Choose any folder on this computer to share with your devices on the local network.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Native Picker Card */}
                <NativePickCard
                  title="Select folder on this computer"
                  sub="Opens File Explorer to pick any folder on your PC"
                  busy={picking}
                  onClick={() => void pickNative()}
                />

                {/* Direct Path Input */}
                <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3.5">
                  <Label htmlFor="manual-folder-path" className="text-xs font-semibold text-foreground">
                    Or enter path directly:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="manual-folder-path"
                      value={manualPath}
                      onChange={(e) => setManualPath(e.target.value)}
                      placeholder="e.g. D:\Downloads or C:\Users\..."
                      className="rounded-xl font-mono text-xs"
                      onKeyDown={(e) => e.key === "Enter" && choosePath(manualPath)}
                    />
                    <Button
                      size="sm"
                      className="shrink-0 rounded-xl"
                      disabled={!manualPath.trim()}
                      onClick={() => choosePath(manualPath)}
                    >
                      Continue
                    </Button>
                  </div>

                  {/* System Shortcuts */}
                  {shortcuts.length > 0 && (
                    <div className="pt-1.5">
                      <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Sparkles className="size-3 text-primary" />
                        Quick access:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {shortcuts.slice(0, 6).map((q) => (
                          <button
                            key={q.path}
                            type="button"
                            onClick={() => choosePath(q.path)}
                            className="flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-accent"
                          >
                            {q.kind === "drive" ? (
                              <HardDrive className="size-3 text-amber-500" />
                            ) : (
                              <FolderOpen className="size-3 text-primary" />
                            )}
                            <span>{q.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Browse Computer Button */}
                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2"
                  onClick={() => setBrowserOpen(true)}
                >
                  <FolderSearch className="size-4 text-muted-foreground" />
                  Browse drives & folders on computer…
                </Button>
              </div>
            </>
          )}

          {step === "configure" && (
            <>
              <DialogHeader>
                <DialogTitle>Share “{name || "folder"}”</DialogTitle>
                <DialogDescription>
                  Configure access settings for devices on your network.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="share-name" className="text-xs font-semibold">
                    Folder name & real path
                  </Label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground font-medium">
                      {pickedAbs}
                    </span>
                    <button
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setStep("pick")}
                      aria-label="Change folder"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                  <Input
                    id="share-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Folder name"
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Access</Label>
                  <RadioGroup value={access} onValueChange={(v) => setAccess(v as "read" | "readwrite")}>
                    <label
                      htmlFor="acc-rw"
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                        access === "readwrite" ? "border-primary/60 bg-accent/40" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="readwrite" id="acc-rw" className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Read & Write</p>
                        <p className="text-xs text-muted-foreground">
                          Devices can browse, download, upload, and organize files in this folder.
                        </p>
                      </div>
                    </label>
                    <label
                      htmlFor="acc-ro"
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                        access === "read" ? "border-primary/60 bg-accent/40" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="read" id="acc-ro" className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Read Only</p>
                        <p className="text-xs text-muted-foreground">
                          Devices can browse and download — no modifications permitted.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-border p-3.5">
                  <div className="pr-3">
                    <p className="text-sm font-semibold">Guest browser access</p>
                    <p className="text-xs text-muted-foreground">
                      Anyone on this network can open the share link — no pairing needed.
                    </p>
                  </div>
                  <Switch checked={guest} onCheckedChange={setGuest} />
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("pick")}>
                  Back
                </Button>
                <Button onClick={create} disabled={creating || !name.trim()}>
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Share Folder
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "done" && created && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  Shared successfully
                </DialogTitle>
                <DialogDescription>
                  “{created.name}” is now shared and accessible on your network.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{created.name}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                    ● Available
                  </span>
                </div>
                <code className="block truncate rounded-lg bg-background px-3 py-2 text-xs font-mono text-muted-foreground">
                  {created.rootPath}
                </code>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Done
                </Button>
                <Button onClick={() => setQrOpen(true)}>Show QR & Link</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Computer Folder Browser Dialog */}
      <FolderBrowserDialog
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        mode="shares"
        title="Select Folder on Computer"
        description="Navigate your computer's drives and folders to choose what to share."
        confirmLabel="Choose this folder"
        onSelect={(absPath) => {
          setBrowserOpen(false);
          choosePath(absPath);
        }}
      />

      {created && (
        <QrDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          title={`Share "${created.name}"`}
          description="Scan with any device on this network — or send the link."
          qrUrl={`/api/qr?text=${encodeURIComponent(buildLanUrl(`/?s=${created.slug}`))}`}
          link={buildLanUrl(`/?s=${created.slug}`)}
        />
      )}
    </>
  );
}
