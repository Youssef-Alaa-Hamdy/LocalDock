/**
 * LocalDock — static website hosting.
 * Serves a hosted site folder with index resolution, correct MIME types,
 * strict path containment, and zero directory listing.
 */
import path from "node:path";
import { mimeOf, resolveSafe } from "./paths";
import { streamFileResponse } from "./files";
import { getWebsiteBySlug } from "./registry";

export async function serveSiteRequest(
  slug: string,
  urlPath: string,
  rangeHeader: string | null
): Promise<Response> {
  const site = getWebsiteBySlug(slug);
  if (!site) {
    return new Response(notFoundPage("This website is not hosted right now."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Normalize: "" and "/" both mean the site root; strip any leading slashes
  // so client input can never smuggle an absolute path through.
  const rel = decodeURIComponent(urlPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = resolveSafe(site.rootPath, rel);
  if (!resolved.ok || resolved.abs === undefined) {
    return new Response(notFoundPage("Not found."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let target = resolved.abs;
  // If a directory was requested, resolve to index.html
  let stat = await statOrNull(target);
  if (stat?.isDirectory()) {
    target = path.join(target, "index.html");
    stat = await statOrNull(target);
  }
  if (!stat || !stat.isFile()) {
    return new Response(notFoundPage("Not found."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return streamFileResponse(target, {
    rangeHeader,
    mime: mimeOf(target),
  });
}

async function statOrNull(p: string): Promise<import("node:fs").Stats | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await (require("node:fs/promises") as typeof import("node:fs/promises")).stat(p);
  } catch {
    return null;
  }
}

function notFoundPage(message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#94a3b8;display:grid;place-items:center;min-height:100vh;margin:0}
div{text-align:center}h1{color:#e2e8f0}</style></head>
<body><div><h1>404</h1><p>${message}</p></div></body></html>`;
}
