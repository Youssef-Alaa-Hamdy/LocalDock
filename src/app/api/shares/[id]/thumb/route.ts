import fs from "node:fs";
import path from "node:path";
import { jsonError } from "@/lib/localdock/files";
import { mimeOf, resolveSafeInside } from "@/lib/localdock/paths";
import { shareGuard } from "@/lib/localdock/api-helpers";
import { getThumbnail } from "@/lib/localdock/thumbs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SIZE_RE = /^\d{2,3}$/;

/**
 * Tiny cached preview image for grid/list tiles.
 *  - images -> sharp resize (EXIF-aware)
 *  - videos -> ffmpeg frame grab when the binary exists on the host
 *  - everything else -> 404, clients render their type icon tile instead.
 *
 * Responses are privately cacheable: the cache key embeds mtime+size, so a
 * modified file simply gets a new URL — old entries stay valid forever.
 */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "read");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";
  const sizeParam = url.searchParams.get("s") ?? "320";
  if (!SIZE_RE.test(sizeParam)) return jsonError(400, "bad-params", "Invalid thumbnail size.");
  const size = Math.min(512, Math.max(48, parseInt(sizeParam, 10)));

  const resolved = resolveSafeInside(guard.share.rootPath, rel);
  if (!resolved.ok || !resolved.abs) return jsonError(400, "bad-path", "Invalid file path.");

  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved.abs);
  } catch {
    return jsonError(404, "not-found", "This file no longer exists on disk.");
  }
  if (!stat.isFile()) return jsonError(400, "bad-path", "Not a file.");

  const category = mimeOf(resolved.abs).startsWith("image/")
    ? "image"
    : mimeOf(resolved.abs).startsWith("video/")
      ? "video"
      : null;
  if (!category) return jsonError(404, "no-thumb", "No thumbnail available for this file type.", {
      key: "noThumb",
    });

  const result = await getThumbnail(resolved.abs, stat, size, category);
  if (!result.data) {
    // Generation failed (unsupported codec, missing ffmpeg, huge/corrupt
    // image…) — clients treat 404 as "render the type icon instead".
    return jsonError(404, "thumb-failed", "Thumbnail could not be generated.", {
      key: "thumbFailed",
    });
  }

  return new Response(new Uint8Array(result.data), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(result.data.length),
      "Cache-Control": "private, max-age=604800, immutable",
      "X-LocalDock-Thumb": result.fromCache ? "cache" : "fresh",
    },
  });
}
