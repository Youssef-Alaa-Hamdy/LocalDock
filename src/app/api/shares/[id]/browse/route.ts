import { jsonError, jsonOk, listDir } from "@/lib/localdock/files";
import { shareGuard } from "@/lib/localdock/api-helpers";
import { activeForShare } from "@/lib/localdock/transfer-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "list");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const dir = url.searchParams.get("path") ?? "";
  const result = await listDir(guard.share.rootPath, dir);
  if ("error" in result) {
    if (result.error === "not-found")
      return jsonError(404, "not-found", "This folder no longer exists on disk.", {
      key: "folderNotOnDisk",
    });
    if (result.error === "permission")
      return jsonError(403, "permission", "The server cannot read this folder.", {
      key: "permission",
    });
    return jsonError(400, "bad-path", "Invalid folder path.", { key: "badPath" });
  }

  // Cheap change-detection mode: the file browser polls this every few seconds
  // (tiny payload) and only re-fetches the full listing when the fingerprint
  // moves — so files added from other devices appear live. The response also
  // piggybacks live cross-device transfer activity (uploads tracked natively,
  // downloads reported by the clients) so every device sees the same picture.
  if (url.searchParams.get("summary") === "1") {
    let size = 0;
    let latest = 0;
    for (const e of result.entries) {
      size += e.size;
      if (e.modifiedAt > latest) latest = e.modifiedAt;
    }
    return jsonOk({
      path: dir,
      summary: {
        count: result.entries.length,
        size,
        latest: Math.round(latest),
      },
      activity: activeForShare(id),
    });
  }

  return jsonOk({ path: dir, entries: result.entries });
}
