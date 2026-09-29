import { jsonError, jsonOk } from "@/lib/localdock/files";
import { cancelUpload } from "@/lib/localdock/uploads";
import { readJsonBody, shareGuard } from "@/lib/localdock/api-helpers";
import { trackUploadDone } from "@/lib/localdock/transfer-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  uploadId?: string;
}

export async function POST(req: Request) {
  const body = await readJsonBody<Body>(req);
  if (!body?.uploadId) return jsonError(400, "bad-body", "uploadId is required.");

  const { getUploadSessionShareId } = await import("@/lib/localdock/uploads-sessions");
  const shareId = getUploadSessionShareId(body.uploadId);
  if (!shareId) return jsonOk({ ok: true }); // already gone — cancel is idempotent

  const guard = await shareGuard(req, shareId, "write");
  if ("deny" in guard) return guard.deny;

  await cancelUpload(body.uploadId);
  trackUploadDone(body.uploadId, shareId, "canceled");
  return jsonOk({ ok: true });
}
