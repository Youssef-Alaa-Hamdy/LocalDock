import { jsonError, jsonOk } from "@/lib/localdock/files";
import {
  deleteWebsite,
  getWebsite,
  logActivity,
  updateWebsite,
} from "@/lib/localdock/registry";
import { readJsonBody, requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

interface Body {
  name?: string;
  enabled?: boolean;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJsonBody<Body>(req);
  if (!body) return jsonError(400, "bad-body", "Invalid request body.");

  const before = getWebsite(id);
  const site = await updateWebsite(id, body);
  if (!site) return jsonError(404, "not-found", "Website not found.");

  if (before?.enabled && site.enabled === false) {
    await logActivity("website.stopped", `Website “${site.name}” stopped`);
  }
  return jsonOk({ website: site });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const site = getWebsite(id);
  if (!site) return jsonError(404, "not-found", "Website not found.");
  await deleteWebsite(id);
  await logActivity("website.removed", `Removed website “${site.name}” (files kept on disk)`);
  return jsonOk({ ok: true });
}
