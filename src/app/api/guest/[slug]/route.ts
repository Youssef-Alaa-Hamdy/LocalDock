import { jsonError, jsonOk } from "@/lib/localdock/files";
import { getShareBySlug } from "@/lib/localdock/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Guest device/web discovery of a shared folder by its link slug.
 * Only succeeds when the share explicitly allows guest access.
 */
export async function GET(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const share = getShareBySlug(slug);
  if (!share) {
    return jsonError(404, "not-found", "This link does not match any shared folder.");
  }
  if (!share.guestEnabled) {
    return jsonError(
      403,
      "guest-disabled",
      "This folder is private. Pair your device with the computer to access it."
    );
  }
  return jsonOk({
    share: {
      id: share.id,
      name: share.name,
      slug: share.slug,
      access: share.access,
      guestEnabled: share.guestEnabled,
    },
  });
}
