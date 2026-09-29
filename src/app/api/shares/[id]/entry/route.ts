import fsp from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import { resolveSafeInside, sanitizeName } from "@/lib/localdock/paths";
import { logActivity } from "@/lib/localdock/registry";
import { readJsonBody, shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Rename an entry (file or directory). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "rename");
  if ("deny" in guard) return guard.deny;

  const body = await readJsonBody<{ path?: string; name?: string }>(req);
  if (!body?.path || !body.name) return jsonError(400, "bad-body", "Nothing to rename.");
  const target = resolveSafeInside(guard.share.rootPath, body.path);
  if (!target.ok || !target.abs) return jsonError(400, "bad-path", "Invalid path.");
  const newName = sanitizeName(body.name);
  if (!newName) return jsonError(400, "bad-name", "That name cannot be used.");

  const dest = path.join(path.dirname(target.abs), newName);
  if (dest !== target.abs) {
    try {
      await fsp.access(dest);
      return jsonError(409, "exists", `“${newName}” already exists.`);
    } catch {
      /* ok */
    }
    try {
      await fsp.rename(target.abs, dest);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT")
        return jsonError(404, "not-found", "The item no longer exists.");
      return jsonError(500, "rename-failed", "The item could not be renamed.");
    }
  }
  await logActivity(
    "file.renamed",
    `Renamed “${path.posix.basename(body.path)}” to “${newName}” in “${guard.share.name}”`
  );
  return jsonOk({ ok: true, name: newName });
}

/** Delete an entry (recursively for folders). */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "delete");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const target = resolveSafeInside(guard.share.rootPath, url.searchParams.get("path") ?? "");
  if (!target.ok || !target.abs) return jsonError(400, "bad-path", "Invalid path.");

  try {
    await fsp.rm(target.abs, { recursive: true, force: false });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return jsonError(404, "not-found", "Already deleted.");
    if (code === "EACCES" || code === "EPERM")
      return jsonError(403, "permission", "The system refused to delete this item.");
    return jsonError(500, "delete-failed", "The item could not be deleted.");
  }
  await logActivity(
    "file.deleted",
    `Deleted “${path.posix.basename(target.rel ?? "")}” from “${guard.share.name}”`
  );
  return jsonOk({ ok: true });
}
