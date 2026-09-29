import { jsonOk, searchDir } from "@/lib/localdock/files";
import { shareGuard } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const guard = await shareGuard(req, id, "list");
  if ("deny" in guard) return guard.deny;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const dir = url.searchParams.get("path") ?? "";
  const results = await searchDir(guard.share.rootPath, dir, q);
  return jsonOk({ results, query: q });
}
