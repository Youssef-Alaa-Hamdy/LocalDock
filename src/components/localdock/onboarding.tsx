"use client";

import { useState } from "react";
import { Api } from "@/lib/localdock/client/api";
import { transfers } from "@/lib/localdock/client/transfer-engine";
import { isHostMachine } from "@/lib/localdock/client/host";
import { pickDeviceFolder } from "@/lib/localdock/client/device-folder";
import { useRefresh } from "./data-hooks";
import { LogoMark, StatusDot } from "./primitives";
import { FolderBrowserDialog } from "./folder-browser-dialog";
import { AddDeviceDialog } from "./views/devices";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  FolderPlus,
  Check,
  Lock,
  Wifi,
  Zap,
  ArrowRight,
  Smartphone,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

/**
 * First Run Experience (spec §30):
 *   Welcome -> name your cloud -> add first folder -> pair phone (skippable) -> done.
 * Time-to-first-success: well under a minute.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [serverName, setServerName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addedShare, setAddedShare] = useState<string | null>(null);
  const [pairOpen, setPairOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [addingFromDevice, setAddingFromDevice] = useState(false);
  const refresh = useRefresh();
  const host = isHostMachine();

  /**
   * Companion devices (phones / laptops over LAN): the first folder is
   * picked from THIS device and uploaded — browsing the server's drives
   * from here would be wrong and confusing.
   */
  const addFromDevice = async () => {
    setAddingFromDevice(true);
    try {
      const pick = await pickDeviceFolder();
      if (!pick || pick.entries.length === 0) return;
      const name = pick.rootName || "My folder";
      const res = await Api.createShare({
        name,
        access: "readwrite",
        guestEnabled: true,
        viaUpload: true,
      });
      for (const entry of pick.entries) {
        transfers.enqueueUpload({
          shareId: res.share.id,
          shareName: res.share.name,
          dirPath: entry.relDir,
          file: entry.file,
        });
      }
      setAddedShare(name);
      refresh.refreshShares();
      refresh.refreshSystem();
      toast.success(`Uploading ${pick.entries.length} files from this device…`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAddingFromDevice(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await Api.updateSettings({ onboarded: true, ...(serverName.trim() ? { serverName: serverName.trim() } : {}) });
      refresh.refreshSystem();
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
      onDone();
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-3">
          <LogoMark className="size-12 rounded-2xl shadow-card" />
          <div>
            <p className="text-xl font-bold tracking-tight">LocalDock</p>
            <p className="text-xs font-medium text-muted-foreground">Your personal local cloud</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-7 shadow-pop sm:p-9">
          {step === 0 && (
            <div className="rise text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Turn this computer into your private cloud.
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Share folders with every device on your network — as easy as Google Drive, but
                your files never leave this room.
              </p>
              <div className="mt-6 grid gap-2.5 text-left">
                {[
                  { icon: Lock, title: "Private", desc: "Nothing ever reaches the internet" },
                  { icon: Zap, title: "Fast", desc: "Full local network speed, resumable transfers" },
                  { icon: Wifi, title: "Local", desc: "Works even when the internet is down" },
                ].map((f) => (
                  <div key={f.title} className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background/50 p-3.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="size-4.5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                className="mt-7 w-full rounded-2xl text-base"
                onClick={() => setStep(1)}
              >
                Get Started <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="rise">
              <StepHeader
                title="Name your cloud"
                desc="This is how your devices will recognize this computer."
                step={1}
                total={3}
              />
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="My PC"
                className="mt-4 h-12 rounded-2xl text-base"
                autoFocus
              />
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => setStep(0)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl text-base"
                  onClick={() => setStep(2)}
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rise">
              <StepHeader
                title="Add your first folder"
                desc={
                  host
                    ? "Pick a folder — it becomes available on your other devices instantly."
                    : "Pick a folder from this device — it uploads to the computer, then becomes available on your network."
                }
                step={2}
                total={3}
              />
              {addedShare ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.06] p-4">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">“{addedShare}” is being shared</p>
                    <p className="text-xs text-muted-foreground">
                      {host ? "Available on your network now." : "Uploading from this device now."}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (host) setAddOpen(true);
                    else void addFromDevice();
                  }}
                  disabled={addingFromDevice}
                  className="card-lift mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border py-10 transition-colors hover:border-primary/50 hover:bg-accent/30 disabled:opacity-60"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FolderPlus className="size-6" strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-semibold">
                    {addingFromDevice
                      ? "Waiting for the folder picker…"
                      : host
                        ? "Choose a folder to share"
                        : "Choose a folder from this device"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {host
                      ? "Documents, photos, projects — anything"
                      : "It will upload to the computer over your local network"}
                  </span>
                </button>
              )}
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => setStep(1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl text-base"
                  disabled={!addedShare}
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rise">
              <StepHeader
                title="Connect your phone"
                desc="Scan the QR with LocalDock on your phone — one scan, remembered forever."
                step={3}
                total={3}
              />
              <button
                onClick={() => setPairOpen(true)}
                className="card-lift mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-accent/30"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Smartphone className="size-6" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold">Show pairing QR code</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StatusDot ok pulse={false} className="bg-primary" />
                  takes about ten seconds
                </span>
              </button>
              <Button
                size="lg"
                className="mt-6 w-full rounded-2xl text-base"
                onClick={finish}
                disabled={finishing}
              >
                {finishing ? "Preparing your cloud…" : "You're ready — open LocalDock"}
              </Button>
              <p className="mt-2.5 text-center text-xs text-muted-foreground">
                You can pair devices anytime from <span className="font-semibold">Devices</span>.
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Local only · No account · No cloud · No tracking
        </p>
      </div>

      {host && (
        <FolderBrowserDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          mode="shares"
          title="Add your first folder"
          description="Pick a folder on this computer — or create a new one."
          confirmLabel="Share this folder"
          onSelect={async (rel) => {
            try {
              const clean = rel.replace(/[\\/]+$/, "");
              const name = clean.split(/[\\/]/).filter(Boolean).pop() || "My folder";
              await Api.createShare({ name, absPath: rel, access: "readwrite", guestEnabled: true });
              setAddedShare(name);
              refresh.refreshShares();
              refresh.refreshSystem();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      <AddDeviceDialog open={pairOpen} onOpenChange={setPairOpen} />
    </div>
  );
}

function StepHeader({
  title,
  desc,
  step,
  total,
}: {
  title: string;
  desc: string;
  step: number;
  total: number;
}) {
  return (
    <div>
      <Progress value={(step / total) * 100} className="h-1 rounded-full" />
      <h2 className="mt-4 text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
