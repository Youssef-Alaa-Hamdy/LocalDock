import { jsonError, jsonOk } from "@/lib/localdock/files";
import {
  addDevice,
  consumePairingCode,
  getSettings,
  logActivity,
  serverBaseUrlFrom,
  listShares,
  VERSION,
} from "@/lib/localdock/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  code?: string;
  deviceName?: string;
  platform?: string;
}

/**
 * Claim a pairing code -> become a trusted device.
 * Returns a persistent device token (stored hashed on the server).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.code || typeof body.code !== "string") {
    return jsonError(400, "bad-body", "A pairing code is required.");
  }
  const claimed = await consumePairingCode(body.code.trim().toUpperCase());
  if (!claimed) {
    return jsonError(
      401,
      "invalid-code",
      "That code is invalid or expired. Generate a new one on the computer."
    );
  }

  const { device, token } = await addDevice({
    name: (body.deviceName ?? "").trim() || "My device",
    platform: (body.platform ?? "").trim() || "web",
  });
  const settings = getSettings();
  await logActivity("device.paired", `Paired a new device: “${device.name}”`, {
    platform: device.platform,
  });

  return jsonOk({
    device: { id: device.id, name: device.name, pairedAt: device.pairedAt },
    deviceToken: token,
    server: {
      serverId: settings.serverId,
      serverName: settings.serverName,
      baseUrl: serverBaseUrlFrom(req),
      version: VERSION,
    },
    // visibility of what this device can reach (per-share rules still apply)
    shares: listShares().map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      access: s.access,
    })),
  });
}
