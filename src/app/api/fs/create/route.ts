import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { jsonError, jsonOk } from "@/lib/localdock/files";
import { sanitizeName } from "@/lib/localdock/paths";
import { requireOwner } from "@/lib/localdock/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  path?: string;
  name?: string;
}

/** Create a real folder on the computer inside the selected path. */
export async function POST(req: Request) {
  const denied = await requireOwner(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as Body | null;
  const name = sanitizeName(body?.name ?? "");
  if (!name)
    return jsonError(400, "bad-name", "That folder name cannot be used.", { key: "badName" });

  const basePath = body?.path?.trim() || os.homedir();
  if (!path.isAbsolute(basePath)) {
    return jsonError(400, "bad-path", "Please select a valid folder first.", { key: "needValidFolder" });
  }

  const target = path.join(basePath, name);
  try {
    await fsp.access(target);
    return jsonError(409, "exists", `“${name}” already exists in this location.`, {
      key: "folderExistsHere",
      params: { name },
    });
  } catch {
    /* ok */
  }

  try {
    await fsp.mkdir(target, { recursive: true });
    return jsonOk({ ok: true, path: target, name }, 201);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") {
      return jsonError(
        403,
        "permission",
        "Permission denied: Cannot create folder in this location.",
        { key: "permission" }
      );
    }
    return jsonError(500, "create-failed", "Could not create the folder.", { key: "createFailed" });
  }
}
