import fsp from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import { resolveSafe, sanitizeName } from "@/lib/localdock/paths";
import { logActivity } from "@/lib/localdock/registry";
import { readJsonBody, shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

interface Body {
  path?: string;
  name?: string;
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "write");
  if ("deny" in guard) return guard.deny;

  const body = await readJsonBody<Body>(req);
  const name = sanitizeName(body?.name ?? "");
  if (!name) return jsonError(400, "bad-name", "That folder name cannot be used.");
  // The destination may be the share root itself (path = ""), so use resolveSafe.
  const dirRes = resolveSafe(guard.share.rootPath, body?.path ?? "/");
  if (!dirRes.ok || !dirRes.abs)
    return jsonError(400, "bad-path", "Invalid destination folder.");

  const target = path.join(dirRes.abs, name);
  try {
    await fsp.access(target);
    return jsonError(409, "exists", `“${name}” already exists in this folder.`);
  } catch {
    /* good — does not exist */
  }
  try {
    await fsp.mkdir(target);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EACCES")
      return jsonError(403, "permission", "The server cannot write inside this folder.");
    return jsonError(500, "create-failed", "The folder could not be created.");
  }
  await logActivity("file.created", `Created folder “${name}” in “${guard.share.name}”`);
  return jsonOk({ ok: true, name }, 201);
}
