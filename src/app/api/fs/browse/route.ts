import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DirItem {
  name: string;
  path: string;
  kind?: "drive" | "shortcut" | "dir";
}

function getSystemDrives(): DirItem[] {
  const drives: DirItem[] = [];
  if (process.platform === "win32") {
    for (const letter of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
      const p = `${letter}:\\`;
      try {
        fs.accessSync(p, fs.constants.R_OK);
        drives.push({ name: `Drive (${letter}:)`, path: p, kind: "drive" });
      } catch {
        /* not present */
      }
    }
  } else {
    drives.push({ name: "Root (/)", path: "/", kind: "drive" });
  }
  return drives;
}

function getSystemShortcuts(): DirItem[] {
  const home = os.homedir();
  const candidates: { name: string; rel: string }[] = [
    { name: "Downloads", rel: "Downloads" },
    { name: "Documents", rel: "Documents" },
    { name: "Desktop", rel: "Desktop" },
    { name: "Pictures", rel: "Pictures" },
  ];
  const shortcuts: DirItem[] = [];
  for (const c of candidates) {
    const full = path.join(home, c.rel);
    try {
      if (fs.existsSync(full)) {
        shortcuts.push({ name: c.name, path: full, kind: "shortcut" });
      }
    } catch {
      /* ignore */
    }
  }
  shortcuts.push({ name: `User Home (${path.basename(home)})`, path: home, kind: "shortcut" });
  return shortcuts;
}

/**
 * Real computer filesystem browser.
 * Lets the owner navigate the computer's drives and folders to choose a folder to share.
 */
export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const targetPath = (url.searchParams.get("path") ?? "").trim();
  const mode = url.searchParams.get("mode") ?? "shares";

  // Root view: show system drives and common user shortcuts
  if (!targetPath) {
    const drives = getSystemDrives();
    const shortcuts = getSystemShortcuts();
    return jsonOk({
      cwd: "",
      isRoot: true,
      parent: null,
      drives,
      shortcuts,
      dirs: [...shortcuts, ...drives],
      hasIndexHtml: false,
    });
  }

  // Normalize path
  const normalized = path.normalize(targetPath);

  try {
    const stat = await fsp.stat(normalized);
    if (!stat.isDirectory()) {
      return jsonError(400, "not-a-dir", "The selected path is not a folder.", { key: "notDir" });
    }
  } catch {
    return jsonError(404, "not-found", "That folder was not found on this computer.", {
      key: "folderNotOnDisk",
    });
  }

  // Calculate parent directory
  let parent: string | null = null;
  const isDriveRoot = /^[A-Za-z]:\\?$/.test(normalized) || normalized === "/";
  if (!isDriveRoot) {
    parent = path.dirname(normalized);
  } else {
    parent = ""; // Go back to drives list
  }

  // Read directory entries
  try {
    const dirents = await fsp.readdir(normalized, { withFileTypes: true });
    const skipNames = new Set(["$RECYCLE.BIN", "System Volume Information", "recovery", "node_modules"]);
    const dirs: DirItem[] = [];
    let hasIndexHtml = false;

    for (const d of dirents) {
      if (d.name.startsWith(".") || skipNames.has(d.name.toUpperCase())) continue;
      if (d.isDirectory()) {
        dirs.push({
          name: d.name,
          path: path.join(normalized, d.name),
          kind: "dir",
        });
      } else if (mode === "websites" && d.name.toLowerCase() === "index.html") {
        hasIndexHtml = true;
      }
    }

    dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return jsonOk({
      cwd: normalized,
      isRoot: false,
      parent,
      dirs,
      hasIndexHtml,
    });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") {
      return jsonError(
        403,
        "permission",
        "The server does not have permission to read this folder.",
        { key: "permission" }
      );
    }
    return jsonError(500, "read-failed", "Could not read this folder.", { key: "readFailed" });
  }
}
