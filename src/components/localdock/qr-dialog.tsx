"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Timer } from "lucide-react";
import { toast } from "sonner";

/** Reusable QR presentation with copy-link support. */
export function QrDialog({
  open,
  onOpenChange,
  title,
  description,
  qrUrl,
  link,
  expiresInSec,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  qrUrl: string;
  link: string;
  expiresInSec?: number | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (!v) setCopied(false); // reset copy state when the dialog closes
    onOpenChange(v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — long-press the link below to copy it.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex w-full min-w-0 flex-col items-center gap-4">
          <div className="rise shrink-0 rounded-2xl border border-border bg-white p-3 shadow-card">
            { }
            <img
              src={qrUrl}
              alt="QR code"
              className="size-52 rounded-lg"
              width={208}
              height={208}
            />
          </div>
          {typeof expiresInSec === "number" && expiresInSec > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Timer className="size-3.5" />
              Code expires in{" "}
              <span className="tnum font-semibold text-foreground">
                {Math.ceil(expiresInSec / 60) > 0
                  ? `${Math.ceil(expiresInSec / 60)} min`
                  : `${expiresInSec} s`}
              </span>
            </div>
          )}
          <div className="flex w-full min-w-0 items-center gap-2">
            <code className="ld-scroll min-w-0 flex-1 truncate rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
              {link}
            </code>
            <Button
              size="icon"
              variant="outline"
              className="size-10 shrink-0 rounded-xl"
              onClick={copy}
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
