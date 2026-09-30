import fsp from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonOk, resolveNativeFolder } from "@/lib/localdock/files";
import { createWebsite, listWebsites, logActivity } from "@/lib/localdock/registry";
import { readJsonBody, requireOwner } from "@/lib/localdock/api-helpers";
import { resolveSafe, validateSlug, slugify } from "@/lib/localdock/paths";
import { SITES_DIR } from "@/lib/localdock/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  return jsonOk({ websites: listWebsites() });
}

interface Body {
  name?: string;
  homeDirRel?: string;
  /** Absolute OS path picked via the native dialog (desktop shell only). */
  absPath?: string;
  slug?: string;
}

export async function POST(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;
  const body = await readJsonBody<Body>(req);
  if (!body?.name?.trim())
    return jsonError(400, "bad-name", "Give the website a name.", { key: "needWebsiteName" });

  // Desktop shell: a real folder anywhere on this machine.
  // Web: the server-side browser, bounded to the LocalDock home.
  let rootAbs: string;
  if (body.absPath) {
    const native = await resolveNativeFolder(body.absPath);
    if (!native.ok) return jsonError(400, native.code, native.message);
    rootAbs = native.abs;
  } else {
    const resolved = resolveSafe(SITES_DIR, body.homeDirRel ?? "");
    if (!resolved.ok || !resolved.abs)
      return jsonError(400, "bad-path", "Choose the website folder from the browser.", {
      key: "chooseFolder",
    });
    rootAbs = resolved.abs;
  }

  // The folder must contain an index.html — that is what makes it a website.
  try {
    const stat = await fsp.stat(rootAbs);
    if (!stat.isDirectory())
      return jsonError(400, "not-a-dir", "The selected path is not a folder.", { key: "notDir" });
    await fsp.access(path.join(rootAbs, "index.html"));
  } catch {
    return jsonError(
      400,
      "no-index",
      "This folder has no index.html — add one and try hosting again."
    );
  }

  if (body.slug && !validateSlug(slugify(body.slug))) {
    return jsonError(400, "bad-slug", "Use letters, numbers and dashes for the address.", {
      key: "badAddress",
    });
  }

  const site = await createWebsite({
    name: body.name,
    rootPath: rootAbs,
    slug: body.slug,
  });
  await logActivity(
    "website.hosted",
    `Website “${site.name}” is live`,
    { slug: site.slug },
    { key: "websiteHosted", params: { name: site.name } }
  );
  return jsonOk({ website: site }, 201);
}
