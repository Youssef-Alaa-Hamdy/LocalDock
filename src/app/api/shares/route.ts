import fsp from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import {
  createShare,
  listShares,
  logActivity,
  setShareStats,
} from "@/lib/localdock/registry";
import { readJsonBody, requireOwner } from "@/lib/localdock/api-helpers";
import { measureDir, resolveNativeFolder } from "@/lib/localdock/files";
import { HOME, SHARES_DIR } from "@/lib/localdock/store";
import { resolveSafe } from "@/lib/localdock/paths";
import type { ShareAccess } from "@/lib/localdock/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  return jsonOk({ shares: listShares() });
}

interface CreateBody {
  name?: string;
  /** Either an absolute path inside the LocalDock home (from the folder browser), */
  homeDirRel?: string;
  /**
   * Absolute OS path picked through the native folder dialog (desktop shell
   * only — rejected outright in web deployments).
   */
  absPath?: string;
  access?: ShareAccess;
  guestEnabled?: boolean;
}

export async function POST(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const body = await readJsonBody<CreateBody>(req);
  if (!body?.name || !body.name.trim()) {
    return jsonError(400, "bad-name", "Please give this folder a name.");
  }

  const rawPath = (body.absPath || body.homeDirRel || "").trim();
  if (!rawPath) {
    return jsonError(400, "bad-path", "Please select or enter a folder path to share.");
  }

  let rootAbs: string;
  if (path.isAbsolute(rawPath)) {
    const native = await resolveNativeFolder(rawPath);
    if (!native.ok) return jsonError(400, native.code, native.message);
    rootAbs = native.abs;
  } else {
    const resolved = resolveSafe(SHARES_DIR, rawPath);
    if (resolved.ok && resolved.abs) {
      rootAbs = resolved.abs;
    } else {
      const native = await resolveNativeFolder(path.resolve(rawPath));
      if (!native.ok) return jsonError(400, native.code, native.message);
      rootAbs = native.abs;
    }
  }

  const share = await createShare({
    name: body.name,
    rootPath: rootAbs,
    access: body.access === "readwrite" ? "readwrite" : "read",
    guestEnabled: !!body.guestEnabled,
  });

  // compute initial stats asynchronously (fire and forget)
  void measureDir(share.rootPath).then(({ sizeBytes, itemCount }) =>
    setShareStats(share.id, sizeBytes, itemCount)
  );

  await logActivity("share.created", `Started sharing “${share.name}”`, {
    access: share.access,
    guest: share.guestEnabled,
  });
  return jsonOk({ share }, 201);
}
