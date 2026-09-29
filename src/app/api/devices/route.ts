import { jsonOk } from "@/lib/localdock/files";
import { listDevices } from "@/lib/localdock/registry";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const now = Date.now();
  return jsonOk({
    devices: listDevices().map((d) => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      pairedAt: d.pairedAt,
      lastSeenAt: d.lastSeenAt,
      online: now - d.lastSeenAt < 45_000,
    })),
  });
}
