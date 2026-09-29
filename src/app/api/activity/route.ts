import { jsonOk } from "@/lib/localdock/files";
import { listActivity } from "@/lib/localdock/registry";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40) || 40, 200);
  return jsonOk({ activity: listActivity(limit) });
}
