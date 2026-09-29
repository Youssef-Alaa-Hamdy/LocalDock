import os from "node:os";
import { jsonOk } from "@/lib/localdock/files";
import {
  diskUsage,
  getSettings,
  listDevices,
  listShares,
  networkInterfaces,
  pickPrimaryLanIp,
  VERSION,
  STARTED_AT,
} from "@/lib/localdock/registry";
import { currentSpeedBps } from "@/lib/localdock/metrics";
import { requireOwner } from "@/lib/localdock/api-helpers";
import { HOME } from "@/lib/localdock/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const settings = getSettings();
  const shares = listShares();
  const devices = listDevices();
  const now = Date.now();
  const storage = await diskUsage(HOME);

  return jsonOk({
    online: true,
    version: VERSION,
    serverId: settings.serverId,
    serverName: settings.serverName,
    startedAt: STARTED_AT,
    uptimeSec: Math.floor((now - STARTED_AT) / 1000),
    devicesOnline: devices.filter((d) => now - d.lastSeenAt < 45_000).length,
    devicesTrusted: devices.length,
    sharesCount: shares.length,
    sharedBytes: shares.reduce((acc, s) => acc + s.sizeBytes, 0),
    transferSpeedBps: currentSpeedBps(),
    activeTransfers: 0, // client-side value merges in the UI
    platform: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
    network: networkInterfaces(),
    /** Best-guess primary LAN IPv4 — kept fresh for share links / QR codes. */
    lanIp: pickPrimaryLanIp(),
    storage,
  });
}
