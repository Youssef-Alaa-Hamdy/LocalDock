import { serveSiteRequest } from "@/lib/localdock/static-site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; path?: string[] }> };

/**
 * Serves hosted websites: /sites/{slug}/... (read-only, path-contained).
 * The root gets a canonical trailing slash so relative asset URLs in user
 * HTML resolve correctly (/sites/{slug}/assets/style.css).
 */
export async function GET(req: Request, ctx: Ctx) {
  const { slug, path: rest } = await ctx.params;
  const pathname = new URL(req.url).pathname;
  const isRoot = !rest || rest.length === 0;
  if (isRoot && !pathname.endsWith("/")) {
    return new Response(null, {
      status: 308,
      headers: { Location: `/sites/${slug}/` },
    });
  }
  const rel = rest && rest.length > 0 ? rest.join("/") : "";
  return serveSiteRequest(slug, rel, req.headers.get("range"));
}

export async function HEAD(req: Request, ctx: Ctx) {
  return GET(req, ctx);
}
