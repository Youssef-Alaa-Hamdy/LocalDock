import crypto from "node:crypto";
import fs from "node:fs";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import { resolveSafeInside } from "@/lib/localdock/paths";
import { shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const cache = new Map<string, { hex: string; key: string }>();

/** Streaming SHA-256 of a file (cached by path+size+mtime). */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "read");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";
  const resolved = resolveSafeInside(guard.share.rootPath, rel);
  if (!resolved.ok || !resolved.abs) return jsonError(400, "bad-path", "Invalid file path.");

  let stat;
  try {
    stat = await fs.promises.stat(resolved.abs);
  } catch {
    return jsonError(404, "not-found", "File not found.");
  }
  if (!stat.isFile()) return jsonError(400, "not-a-file", "Not a file.");

  const key = `${resolved.abs}:${stat.size}:${Math.floor(stat.mtimeMs)}`;
  const hit = cache.get(resolved.abs);
  if (hit && hit.key === key) return jsonOk({ sha256: hit.hex, size: stat.size });

  const hash = crypto.createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(resolved.abs!, { highWaterMark: 1024 * 1024 });
    stream.on("data", (c) => hash.update(c));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
  const hex = hash.digest("hex");
  cache.set(resolved.abs, { hex, key });
  return jsonOk({ sha256: hex, size: stat.size });
}
