import { jsonError, jsonOk } from "@/lib/localdock/files";
import {
  createPairingCode,
  getSettings,
  pickPrimaryLanIp,
  serverBaseUrlFrom,
  VERSION,
} from "@/lib/localdock/registry";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner asks for a pairing QR. Single-use code with 5-minute TTL. */
export async function POST(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const settings = getSettings();
  const code = await createPairingCode();

  // Use the request-derived base URL for the server side, but build the
  // claimUrl with the real LAN IP so other devices on the network can open it.
  const baseUrl = serverBaseUrlFrom(req);

  // Pick the first non-loopback IPv4 address from the machine's interfaces.
  // Fall back to the request host if none are found (e.g. development).
  const reqUrl = new URL(req.url);
  const port = reqUrl.port || (reqUrl.protocol === "https:" ? "443" : "80");
  const lanIp = pickPrimaryLanIp();
  const lanBase = lanIp
    ? `${reqUrl.protocol}//${lanIp}${port && port !== "80" && port !== "443" ? `:${port}` : ""}`
    : baseUrl;

  const claimUrl = `${lanBase}/?pair=${code.code}`;

  const payload = {
    v: 1,
    app: "localdock",
    type: "pair",
    serverId: settings.serverId,
    serverName: settings.serverName,
    host: lanBase,
    code: code.code,
    expiresAt: code.expiresAt,
    version: VERSION,
  };

  return jsonOk({
    code: code.code,
    expiresAt: code.expiresAt,
    payload,
    claimUrl,
    qrUrl: `/api/qr?text=${encodeURIComponent(claimUrl)}`,
    qrPayloadUrl: `/api/qr?text=${encodeURIComponent(JSON.stringify(payload))}`,
  });
}
