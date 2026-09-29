import { jsonError, jsonOk } from "@/lib/localdock/files";
import { completeUpload } from "@/lib/localdock/uploads";
import { logActivity } from "@/lib/localdock/registry";
import { readJsonBody, shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  uploadId?: string;
  sha256?: string;
}

export async function POST(req: Request) {
  const body = await readJsonBody<Body>(req);
  if (!body?.uploadId) return jsonError(400, "bad-body", "uploadId is required.");

  const { getUploadSessionShareId } = await import("@/lib/localdock/uploads-sessions");
  const shareId = getUploadSessionShareId(body.uploadId);
  if (!shareId) return jsonError(404, "session-not-found", "Upload session expired or canceled.");

  const guard = await shareGuard(req, shareId, "write");
  if ("deny" in guard) return guard.deny;

  try {
    const info = await completeUpload(body.uploadId, body.sha256);
    await logActivity(
      "file.uploaded",
      `Received “${info.finalName}” into “${guard.share.name}”`,
      { bytes: info.size, sha256: info.sha256 ?? null }
    );
    // refresh share stats in the background so sizes stay truthful
    void (async () => {
      const { measureDir } = await import("@/lib/localdock/files");
      const { setShareStats } = await import("@/lib/localdock/registry");
      try {
        const { sizeBytes, itemCount } = await measureDir(guard.share.rootPath);
        await setShareStats(guard.share.id, sizeBytes, itemCount);
      } catch {
        /* stats are best-effort */
      }
    })();
    return jsonOk({ upload: info });
  } catch (e) {
    const msg = (e as Error).message;
    const missing = (e as Error & { missing?: number[] }).missing;
    if (msg === "missing-chunks")
      return jsonOk({ incomplete: true, missingChunks: missing ?? [] });
    if (msg === "checksum-mismatch")
      return jsonError(422, "checksum-mismatch", "The uploaded file failed integrity verification.");
    if (msg === "size-mismatch")
      return jsonError(422, "size-mismatch", "The file on disk does not match the announced size.");
    if (msg === "session-not-found")
      return jsonError(404, "session-not-found", "Upload session expired or canceled.");
    if (msg === "share-gone")
      return jsonError(410, "share-gone", "The shared folder was removed during upload.");
    return jsonError(500, "complete-failed", "The upload could not be finalized.");
  }
}
