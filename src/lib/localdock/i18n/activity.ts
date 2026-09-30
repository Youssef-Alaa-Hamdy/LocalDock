"use client";

/**
 * Renders a server activity entry in the active language.
 * New entries carry a structured `loc` hint; legacy entries (and unknown
 * keys) gracefully fall back to the raw server message.
 */

import type { ActivityEntry } from "../types";
import type { Dictionary } from "./locales";

type ActivityDict = Dictionary["activity"];

export function activityMessage(entry: ActivityEntry, t: ActivityDict): string {
  const loc = entry.loc;
  if (!loc) return entry.message;
  const p = loc.params ?? {};
  const str = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""));
  switch (loc.key) {
    case "devicePaired":
      return t.devicePaired(str(p.name));
    case "deviceRevoked":
      return t.deviceRevoked(str(p.name));
    case "websiteHosted":
      return t.websiteHosted(str(p.name));
    case "websiteStopped":
      return t.websiteStopped(str(p.name));
    case "websiteRemoved":
      return t.websiteRemoved(str(p.name));
    case "folderCreated":
      return t.folderCreated(str(p.name), str(p.share));
    case "shareUpdated":
      return t.shareUpdated(str(p.name));
    case "shareDeleted":
      return t.shareDeleted(str(p.name));
    case "shareCreated":
      return t.shareCreated(str(p.name));
    case "fileUploaded":
      return t.fileUploaded(str(p.name), str(p.share));
    case "fileDownloaded":
      return t.fileDownloaded(str(p.name), str(p.share));
    case "entryRenamed":
      return t.entryRenamed(str(p.from), str(p.to), str(p.share));
    case "entryDeleted":
      return t.entryDeleted(str(p.name), str(p.share));
    case "denied":
      return t.denied(str(p.action), str(p.name));
    default:
      return entry.message;
  }
}
