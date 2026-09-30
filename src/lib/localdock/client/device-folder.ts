"use client";

/**
 * LocalDock — pick a folder FROM THIS DEVICE (browser-native).
 *
 * Uses the classic `<input webkitdirectory>` picker, which every modern
 * browser supports, and maps the selection into upload-ready entries:
 *
 *   webkitRelativePath "Vacation/beach/day1.jpg"
 *     → rootName "Vacation", relDir "beach", file day1.jpg
 *
 * Hidden system junk (.DS_Store, Thumbs.db, desktop.ini, __MACOSX, dotfiles)
 * is filtered so shared folders stay clean.
 */

export interface DeviceFileEntry {
  file: File;
  /** Directory inside the picked folder, with the root name stripped ("" = root). */
  relDir: string;
}

export interface DeviceFolderPick {
  /** Name of the folder the user picked ("" when the browser gives no paths). */
  rootName: string;
  entries: DeviceFileEntry[];
  /** Hidden system files that were filtered out. */
  skipped: number;
}

const JUNK_FILES = new Set(["thumbs.db", "desktop.ini", ".ds_store", "autorun.inf", "dumpstack.log"]);

function isJunkSegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  if (!lower) return true;
  if (lower.startsWith(".")) return true;
  if (JUNK_FILES.has(lower)) return true;
  if (lower === "__macosx") return true;
  return false;
}

/** True when the file is hidden system junk that should never upload. */
export function isJunkFileName(name: string): boolean {
  return isJunkSegment(name);
}

/**
 * Open the device's native folder picker and resolve with the picked tree.
 * Resolves `null` when the user cancels (or picks nothing).
 */
export function pickDeviceFolder(): Promise<DeviceFolderPick | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";
    input.style.opacity = "0";
    document.body.appendChild(input);

    let settled = false;
    const finish = (value: DeviceFolderPick | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("focus", onFocus);
      input.remove();
      resolve(value);
    };

    const onChange = () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) {
        finish(null);
        return;
      }
      let rootName = "";
      const entries: DeviceFileEntry[] = [];
      let skipped = 0;
      for (const file of files) {
        const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || "";
        const segs = rel ? rel.split("/") : [file.name];
        if (segs.some(isJunkSegment)) {
          skipped++;
          continue;
        }
        if (!rootName && segs.length > 1) rootName = segs[0];
        const dirs = segs.slice(0, -1);
        // strip the picked folder's own name — the destination provides it
        const relDir =
          rootName && dirs[0] === rootName ? dirs.slice(1).join("/") : dirs.join("/");
        entries.push({ file, relDir });
      }
      if (entries.length === 0) {
        finish(null);
        return;
      }
      finish({ rootName, entries, skipped });
    };

    // Cancel detection: the OS picker holds focus; when the window regains
    // focus with nothing selected, treat it as canceled.
    const onFocus = () => {
      window.setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 400);
    };

    input.addEventListener("change", onChange, { once: true });
    window.addEventListener("focus", onFocus);
    input.click();
  });
}

/** "Videos" + "sub/dir" → "Videos/sub/dir" (nest an uploaded tree inside a path). */
export function joinDirPath(base: string, relDir: string): string {
  const clean = relDir.replace(/^\/+|\/+$/g, "");
  if (!clean) return base;
  return base ? `${base.replace(/\/+$/, "")}/${clean}` : clean;
}
