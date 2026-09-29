import { jsonOk } from "@/lib/localdock/files";
import { statusOf as engineStatus } from "@/lib/localdock/uploads";
import { shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resume support: report which chunks the server already has. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const { getUploadSessionShareId } = await import("@/lib/localdock/uploads-sessions");
  const shareId = getUploadSessionShareId(uploadId);
  if (!shareId) return jsonOk({ session: null });

  const guard = await shareGuard(req, shareId, "write");
  if ("deny" in guard) return guard.deny;

  const session = await engineStatus(uploadId);
  return jsonOk({ session: session ?? null });
}
