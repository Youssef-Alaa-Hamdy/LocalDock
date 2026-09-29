import { jsonError, jsonOk } from "@/lib/localdock/files";
import { getDeviceById, logActivity, revokeDevice } from "@/lib/localdock/registry";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const device = getDeviceById(id);
  if (!device) return jsonError(404, "not-found", "Device not found.");
  await revokeDevice(id);
  await logActivity("device.revoked", `Revoked trusted device “${device.name}”`);
  return jsonOk({ ok: true });
}
