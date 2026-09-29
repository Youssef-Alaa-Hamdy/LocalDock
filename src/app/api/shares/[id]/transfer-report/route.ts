import { jsonError, jsonOk } from "@/lib/localdock/files";
import { shareGuard } from "@/lib/localdock/api-helpers";
import { deviceClientId, deviceLabel, trackDownloadReport } from "@/lib/localdock/transfer-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

interface Body {
  /** Stable per-browser id, used by other devices to filter their own transfers. */
  clientId?: string;
  key?: string;
  name?: string;
  size?: number;
  transferred?: number;
  status?: "active" | "done" | "failed" | "canceled";
  /** Optional friendly name override (paired phones know their own name). */
  deviceName?: string;
}

/**
 * Download heartbeat. The client transfer engine pings this while a download
 * is running (throttled ~1/s); every OTHER open device sees the live progress
 * through the ?summary=1 browse poll — the same way uploads are visible.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "read");
  if ("deny" in guard) return guard.deny;

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = null;
  }
  if (!body?.key || !body.name || !body.clientId) {
    return jsonError(400, "bad-body", "key, name and clientId are required.");
  }
  if (!/^[a-zA-Z0-9_-]{6,80}$/.test(body.key) || !/^[a-zA-Z0-9_-]{4,80}$/.test(body.clientId)) {
    return jsonError(400, "bad-body", "Malformed transfer key.");
  }
  const status = body.status ?? "active";

  trackDownloadReport({
    shareId: id,
    key: body.key,
    name: body.name.slice(0, 200),
    size: Math.max(0, Math.floor(Number(body.size) || 0)),
    transferred: Math.max(0, Math.floor(Number(body.transferred) || 0)),
    // Paired devices keep their stable server-side id; guests use their
    // browser-generated one so they can filter their own transfers too.
    clientId: guard.auth.kind === "device" ? deviceClientId(guard.auth) : body.clientId,
    device: body.deviceName?.slice(0, 60) || deviceLabel(guard.auth),
    status,
  });

  return jsonOk({ ok: true });
}
