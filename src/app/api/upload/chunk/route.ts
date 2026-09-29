import { jsonError, jsonOk } from "@/lib/localdock/files";
import { writeChunk } from "@/lib/localdock/uploads";
import { shareGuard } from "@/lib/localdock/api-helpers";
import { getUploadSessionShareId } from "@/lib/localdock/uploads-sessions";
import { recordBytes } from "@/lib/localdock/metrics";
import { trackUploadProgress } from "@/lib/localdock/transfer-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUT one chunk. Body is raw bytes (<= 16 MiB). Auth is enforced against the
 * session's share, so a resumed upload keeps its permission checks.
 */
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const index = Number(url.searchParams.get("index") ?? "-1");
  if (!uploadId || !Number.isInteger(index)) {
    return jsonError(400, "bad-params", "uploadId and index are required.");
  }

  const sessionShareId = getUploadSessionShareId(uploadId);
  if (!sessionShareId) return jsonError(404, "session-not-found", "Upload session expired or canceled.");

  const guard = await shareGuard(req, sessionShareId, "write");
  if ("deny" in guard) return guard.deny;

  const data = Buffer.from(await req.arrayBuffer());
  try {
    const result = await writeChunk(uploadId, index, data);
    recordBytes(data.length);
    // Live cross-device progress: received chunks * session chunk size.
    trackUploadProgress(uploadId, sessionShareId, result.received, result.chunkSize ?? 0);
    return jsonOk(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "session-not-found")
      return jsonError(404, "session-not-found", "Upload session expired or canceled.");
    if (msg === "invalid-chunk-index")
      return jsonError(400, "bad-index", "Chunk index out of range.");
    if (msg === "invalid-chunk-size")
      return jsonError(400, "bad-chunk", "Chunk size does not match the session.");
    return jsonError(500, "write-failed", "The chunk could not be written.");
  }
}
