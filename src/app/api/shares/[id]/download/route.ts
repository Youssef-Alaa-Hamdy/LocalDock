import path from "node:path";
import { jsonError, streamFileResponse } from "@/lib/localdock/files";
import { mimeOf, resolveSafeInside } from "@/lib/localdock/paths";
import { logActivity } from "@/lib/localdock/registry";
import { recordBytes } from "@/lib/localdock/metrics";
import { shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Download a file. Supports HTTP Range so downloads are resumable and
 * video/audio seeking works. Bytes are counted into the live network metric.
 */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "read");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";
  const resolved = resolveSafeInside(guard.share.rootPath, rel);
  if (!resolved.ok || !resolved.abs) {
    return jsonError(400, "bad-path", "Invalid file path.", { key: "badPath" });
  }

  const resp = await streamFileResponse(resolved.abs, {
    method: req.method === "HEAD" ? "HEAD" : "GET",
    rangeHeader: req.headers.get("range"),
    mime: mimeOf(resolved.abs),
    download: true,
    filename: path.basename(resolved.abs),
  });

  if (resp.status === 200 || resp.status === 206) {
    const len = Number(resp.headers.get("Content-Length") ?? 0);
    if (len > 0) recordBytes(len);
    if (resp.status === 200) {
      void logActivity(
        "file.downloaded",
        `Downloaded “${path.basename(resolved.abs)}” from “${guard.share.name}”`,
        { bytes: len },
        {
          key: "fileDownloaded",
          params: {
            name: path.basename(resolved.abs),
            share: guard.share.name,
          },
        }
      );
    }
  }
  return resp;
}

export async function HEAD(req: Request, ctx: Ctx) {
  return GET(req, ctx);
}
