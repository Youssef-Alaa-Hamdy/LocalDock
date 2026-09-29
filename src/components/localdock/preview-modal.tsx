"use client";

/**
 * LocalDock — professional in-app preview.
 *
 *  - Images  : zoom (wheel / buttons / double-click), pan, rotate, fit vs 1:1.
 *  - Video   : framed HTML5 player (native controls, streams via Range).
 *  - Audio   : custom player — seek bar, ±10s skip, volume, playback speed.
 *  - PDF     : inline <iframe> with graceful fallback.
 *  - Text    : quick code/text viewer (size-capped).
 *  - Keyboard: ←/→ navigate files, +/-/0 zoom, r rotates, Esc closes.
 *  - All media authenticates with a short-lived share link token, so private
 *    shares preview correctly (plain <img src> used to 403 there).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileEntry } from "@/lib/localdock/types";
import { Api } from "@/lib/localdock/client/api";
import { mediaSrc } from "@/lib/localdock/client/media";
import { formatBytes, formatDateTime } from "@/lib/localdock/client/format";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FastForward,
  Fingerprint,
  Loader2,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Rewind,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEXT_LIMIT = 512 * 1024;

export interface PreviewSibling {
  entry: FileEntry;
  rel: string;
}

export function PreviewModal({
  shareId,
  shareName,
  entry,
  relPath,
  siblings = [],
  onNavigate,
  onClose,
  onDownload,
}: {
  shareId: string;
  shareName: string;
  entry: FileEntry;
  relPath: string;
  siblings?: PreviewSibling[];
  onNavigate?: (sibling: PreviewSibling) => void;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [textTooBig, setTextTooBig] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);

  const index = siblings.findIndex((s) => s.rel === relPath);
  const canPrev = index > 0;
  const canNext = index >= 0 && index < siblings.length - 1;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (index < 0) return;
      const next = siblings[index + dir];
      if (next) onNavigate?.(next);
    },
    [index, siblings, onNavigate]
  );

  /* Resolve the tokenized media URL per file */
  useEffect(() => {
    let alive = true;
    setSrc(null);
    setText(null);
    setTextTooBig(false);
    setHash(null);
    if (entry.kind === "dir") return;
    if (entry.category === "text" || entry.category === "code") {
      if (entry.size > TEXT_LIMIT) {
        setTextTooBig(true);
        return;
      }
      void mediaSrc(shareId, relPath)
        .then((u) => (alive ? fetch(u).then((r) => (r.ok ? r.text() : "")) : ""))
        .then((t) => alive && setText(t))
        .catch(() => alive && setText(null));
    } else {
      void mediaSrc(shareId, relPath).then((u) => alive && setSrc(u));
    }
    return () => {
      alive = false;
    };
  }, [shareId, relPath, entry.category, entry.kind, entry.size]);

  /* Keyboard: navigation + image controls */
  const imageCmdRef = useRef<{ zoom: (d: number) => void; reset: () => void; rotate: (d: number) => void } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft" && canPrev) { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight" && canNext) { e.preventDefault(); go(1); }
      else if (e.key === "+" || e.key === "=") imageCmdRef.current?.zoom(1);
      else if (e.key === "-") imageCmdRef.current?.zoom(-1);
      else if (e.key === "0") imageCmdRef.current?.reset();
      else if (e.key === "r" || e.key === "R") imageCmdRef.current?.rotate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, canPrev, canNext]);

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
        className="ld-preview flex h-[90dvh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-[85vh] sm:max-w-5xl"
      >
        {/* header */}
        <div className="flex min-w-0 items-center gap-2 border-b border-border py-3 pl-3 pr-2.5 sm:pl-5">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-semibold">{entry.name}</DialogTitle>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {formatBytes(entry.size)} · {shareName} · {formatDateTime(entry.modifiedAt)}
              {siblings.length > 1 && index >= 0 && (
                <span className="tnum ml-2 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground/70">
                  {index + 1} / {siblings.length}
                </span>
              )}
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

        {/* body */}
        <div className="ld-preview-body relative flex-1 select-none overflow-hidden bg-[#0b0d12]">
          {/* navigation arrows */}
          {siblings.length > 1 && (
            <>
              <NavArrow side="left" disabled={!canPrev} onClick={() => go(-1)} />
              <NavArrow side="right" disabled={!canNext} onClick={() => go(1)} />
            </>
          )}

          {entry.category === "image" &&
            (src ? (
              <ImageViewer src={src} alt={entry.name} onCmd={(cmd) => (imageCmdRef.current = cmd)} />
            ) : (
              <CenterSpinner />
            ))}

          {entry.category === "video" &&
            (src ? (
              <div className="flex h-full items-center justify-center p-3 sm:p-6">
                <video
                  key={src}
                  src={src}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full rounded-xl bg-black shadow-pop"
                />
              </div>
            ) : (
              <CenterSpinner />
            ))}

          {entry.category === "audio" && (src ? <AudioPlayer src={src} name={entry.name} /> : <CenterSpinner />)}

          {entry.category === "pdf" && (
            src ? (
              <iframe
                key={src}
                src={src}
                title={`PDF preview of ${entry.name}`}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <CenterSpinner />
            )
          )}

          {(entry.category === "text" || entry.category === "code") &&
            (text !== null ? (
              <div className="ld-scroll h-full overflow-auto bg-[#0b0d12] p-4 sm:p-5">
                <pre className="font-mono text-[12.5px] leading-relaxed text-[#d6deeb]">{text}</pre>
              </div>
            ) : textTooBig ? (
              <CenterNote>
                This file is large ({formatBytes(entry.size)}) — download it to view the contents.
              </CenterNote>
            ) : (
              <CenterSpinner />
            ))}

          {entry.category === "archive" && (
            <CenterNote>Archives aren&apos;t previewed — download and open them locally.</CenterNote>
          )}
          {entry.category === "apk" && (
            <CenterNote>APK file — download and install on an Android device.</CenterNote>
          )}
          {entry.category === "other" && (
            <CenterNote>
              No preview for this file type ({entry.mimeType ?? "unknown"}) — download it instead.
            </CenterNote>
          )}
        </div>

        {/* footer */}
        <div className="flex w-full min-w-0 items-center gap-2 border-t border-border px-3 py-2.5 sm:px-5">
          <Button variant="ghost" size="sm" className="shrink-0 rounded-lg text-xs" onClick={verify}>
            <Fingerprint className="size-3.5" />
            <span className="hidden sm:inline">Verify integrity (SHA-256)</span>
            <span className="sm:hidden">SHA-256</span>
          </Button>
          {hashing && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
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

/* ------------------------------------------------------------------ */
/* Image viewer — zoom / pan / rotate                                  */
/* ------------------------------------------------------------------ */

function ImageViewer({
  src,
  alt,
  onCmd,
}: {
  src: string;
  alt: string;
  onCmd: (cmd: { zoom: (d: number) => void; reset: () => void; rotate: (d: number) => void } | null) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(0); // 0 = fit, else scale factor
  const [rot, setRot] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const clampZoom = (z: number) => Math.min(10, Math.max(0.1, z));

  const zoomBy = useCallback((d: number) => {
    setZoom((z) => clampZoom(z === 0 ? (d > 0 ? 1.25 : 0.8) : z * (d > 0 ? 1.25 : 0.8)));
  }, []);

  useEffect(() => {
    onCmd({ zoom: zoomBy, reset: () => { setZoom(0); setPan({ x: 0, y: 0 }); setRot(0); }, rotate: (d) => setRot((r) => (r + d * 90 + 360) % 360) });
    return () => onCmd(null);
  }, [onCmd, zoomBy]);

  /* wheel zoom (non-passive so the page never scrolls behind the modal) */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom === 0) return; // fit mode doesn't pan
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.x),
      y: drag.current.py + (e.clientY - drag.current.y),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={wrapRef}
        className={cn("flex h-full w-full items-center justify-center overflow-hidden", zoom !== 0 && "cursor-grab active:cursor-grabbing")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={() => (zoom === 0 ? setZoom(1) : setZoom(0))}
      >
        {!loaded && (
          <Loader2 className="absolute size-7 animate-spin text-white/40" aria-hidden />
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          draggable={false}
          className={cn(
            "max-h-full max-w-full rounded-lg object-contain transition-[opacity] duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          style={
            zoom === 0
              ? { transform: `rotate(${rot}deg)` }
              : {
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rot}deg)`,
                  transition: dragging ? "none" : "transform 0.12s ease-out",
                }
          }
        />
      </div>

      {/* control bar */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/55 p-1 text-white shadow-pop backdrop-blur-md">
        <IconBtn label="Zoom out" onClick={() => zoomBy(-1)}><Minus className="size-4" /></IconBtn>
        <button
          className="tnum min-w-14 rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-white/10"
          onClick={() => setZoom((z) => (z === 0 ? 1 : 0))}
          title="Toggle fit / 100%"
        >
          {zoom === 0 ? "Fit" : `${Math.round(zoom * 100)}%`}
        </button>
        <IconBtn label="Zoom in" onClick={() => zoomBy(1)}><Plus className="size-4" /></IconBtn>
        <span className="mx-0.5 h-5 w-px bg-white/15" />
        <IconBtn label="Rotate left" onClick={() => setRot((r) => (r + 270) % 360)}><RotateCcw className="size-4" /></IconBtn>
        <IconBtn label="Rotate right" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw className="size-4" /></IconBtn>
        <IconBtn label="Reset (fit)" onClick={() => { setZoom(0); setPan({ x: 0, y: 0 }); setRot(0); }}>
          <Maximize2 className="size-4" />
        </IconBtn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audio player — custom professional controls                         */
/* ------------------------------------------------------------------ */

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const RATES = [1, 1.25, 1.5, 2, 0.75];

function AudioPlayer({ src, name }: { src: string; name: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rateIdx, setRateIdx] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  };
  const skip = (d: number) => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) a.currentTime = Math.min(a.duration, Math.max(0, a.currentTime + d));
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-pop backdrop-blur-md sm:p-6">
        {/* art */}
        <div className="relative mx-auto flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/80 to-primary/40 text-white shadow-card sm:size-32">
          <span className={cn("text-4xl", playing && "ld-bounce")} aria-hidden>♪</span>
          {playing && (
            <span className="absolute -bottom-1 flex h-3 items-end gap-0.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="ld-bar w-1 rounded-full bg-white/90" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </span>
          )}
        </div>
        <p className="mt-4 truncate text-center text-sm font-bold text-white">{name}</p>

        {/* seek */}
        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={Math.min(cur, dur || 0)}
          onChange={(e) => {
            const a = audioRef.current;
            const v = Number(e.target.value);
            if (a) a.currentTime = v;
            setCur(v);
          }}
          className="ld-range mt-4 w-full"
          aria-label="Seek"
        />
        <div className="tnum mt-1 flex justify-between text-[11px] font-medium text-white/60">
          <span>{fmtTime(cur)}</span>
          <span>{fmtTime(dur)}</span>
        </div>

        {/* controls */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <IconBtn label="Back 10 seconds" onClick={() => skip(-10)} dark><Rewind className="size-4" /></IconBtn>
          <button
            onClick={toggle}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-[1px]" />}
          </button>
          <IconBtn label="Forward 10 seconds" onClick={() => skip(10)} dark><FastForward className="size-4" /></IconBtn>
        </div>

        {/* volume + speed */}
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
          <IconBtn
            label={muted ? "Unmute" : "Mute"}
            dark
            onClick={() => {
              const a = audioRef.current;
              setMuted((m) => {
                if (a) a.muted = !m;
                return !m;
              });
            }}
          >
            {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setMuted(v === 0);
              const a = audioRef.current;
              if (a) { a.volume = v; a.muted = v === 0; }
            }}
            className="ld-range flex-1"
            aria-label="Volume"
          />
          <button
            className="tnum shrink-0 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/20"
            onClick={() => {
              const next = (rateIdx + 1) % RATES.length;
              setRateIdx(next);
              const a = audioRef.current;
              if (a) a.playbackRate = RATES[next];
            }}
            title="Playback speed"
          >
            {RATES[rateIdx]}×
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function IconBtn({
  children,
  label,
  onClick,
  dark = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg transition-colors",
        dark ? "text-white/85 hover:bg-white/10 hover:text-white" : "hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

function NavArrow({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous file" : "Next file"}
      className={cn(
        "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 shadow-pop backdrop-blur-md transition-all hover:bg-black/65 hover:text-white active:scale-95",
        side === "left" ? "left-2 sm:left-3" : "right-2 sm:right-3",
        disabled && "pointer-events-none opacity-0"
      )}
    >
      {side === "left" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}

function CenterSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-white/40" />
    </div>
  );
}

function CenterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/60">
      <div>{children}</div>
    </div>
  );
}
