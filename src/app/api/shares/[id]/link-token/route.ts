import { jsonOk } from "@/lib/localdock/files";
import { shareGuard } from "@/lib/localdock/api-helpers";
import { issueLinkToken } from "@/lib/localdock/link-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Issue a short-lived, share-scoped link token so header-less media loads
 * (grid thumbnails, preview <img>/<video>/<iframe>) work on private shares.
 * The token inherits the caller's identity and expires 15 minutes after its
 * last use — a fresh one is one POST away.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "read");
  if ("deny" in guard) return guard.deny;

  const token = issueLinkToken(id, guard.auth);
  return jsonOk({ token, expiresInSec: 15 * 60 });
}
