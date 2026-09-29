"use client";

import { useEffect, useState } from "react";
import type { FileEntry } from "@/lib/localdock/types";
import { Api } from "@/lib/localdock/client/api";
import { formatBytes, formatDateTime } from "@/lib/localdock/client/format";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const TEXT_LIMIT = 512 * 1024;

/** In-app preview for images, video, audio, PDF and text. */
export function PreviewModal({
  shareId,
  shareName,
  entry,
  relPath,
  onClose,
  onDownload,
}: {
  shareId: string;
  shareName: string;
  entry: FileEntry;
  relPath: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [textTooBig, setTextTooBig] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);

  const src = `/api/shares/${shareId}/file?path=${encodeURIComponent(relPath)}`;

  useEffect(() => {
    setText(null);
    setTextTooBig(false);
    setHash(null);
    if (entry.category === "text") {
      if (entry.size > TEXT_LIMIT) {
        setTextTooBig(true);
        return;
      }
      void fetch(src)
        .then((r) => (r.ok ? r.text() : ""))
        .then(setText)
        .catch(() => setText(null));
    }
     
  }, [relPath, entry.name]);

  const verify = async () => {
    setHashing(true);
    try {
      const res = await Api.fileHash(shareId, relPath);
      setHash(res.sha256);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setHashing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="flex h-[86vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:h-[80vh]"
      >
        <div className="flex min-w-0 items-center gap-2 border-b border-border py-3.5 pl-5 pr-2.5">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-semibold">{entry.name}</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(entry.size)} · {shareName} · {formatDateTime(entry.modifiedAt)}
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={onDownload}>
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="ld-scroll relative flex-1 overflow-auto bg-muted/30">
          {entry.category === "image" && (
            <div className="flex h-full items-center justify-center p-6">
              { }
              <img
                src={src}
                alt={entry.name}
                className="max-h-full max-w-full rounded-xl object-contain shadow-card"
              />
            </div>
          )}
          {entry.category === "video" && (
            <div className="flex h-full items-center justify-center p-6">
              <video src={src} controls className="max-h-full max-w-full rounded-xl shadow-card" />
            </div>
          )}
          {entry.category === "audio" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
              <div className="rounded-3xl bg-primary/10 p-8 text-primary text-4xl font-bold tracking-tight">
                ♪
              </div>
              <audio src={src} controls className="w-full max-w-md" />
            </div>
          )}
          {entry.category === "pdf" && (
            <object data={src} type="application/pdf" className="h-full w-full">
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Your browser can't display PDFs inline.
                </p>
                <Button variant="outline" onClick={onDownload}>
                  Download the PDF instead
                </Button>
              </div>
            </object>
          )}
          {entry.category === "text" || entry.category === "code" ? (
            text !== null ? (
              <pre className="ld-scroll h-full overflow-auto bg-background/60 p-5 font-mono text-[13px] leading-relaxed text-foreground/90">
                {text}
              </pre>
            ) : textTooBig ? (
              <CenteredNote>
                This file is large ({formatBytes(entry.size)}) — download it to view the contents.
              </CenteredNote>
            ) : (
              <CenteredNote>
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-muted-foreground" />
                Loading preview…
              </CenteredNote>
            )
          ) : null}
          {entry.category === "archive" && (
            <CenteredNote>
              Archives aren't previewed — download and open them locally.
            </CenteredNote>
          )}
          {entry.category === "apk" && (
            <CenteredNote>APK file — download and install on an Android device.</CenteredNote>
          )}
          {entry.category === "other" && (
            <CenteredNote>
              No preview for this file type ({entry.mimeType ?? "unknown"}) — download it instead.
            </CenteredNote>
          )}
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 border-t border-border px-5 py-2.5">
          <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={verify}>
            <Fingerprint className="size-3.5" />
            Verify integrity (SHA-256)
          </Button>
          {hashing && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          {hash && (
            <code className="ld-scroll min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {hash}
            </code>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
      <div>{children}</div>
    </div>
  );
}
