/**
 * Session peek used by the chunk endpoint to resolve permissions
 * before touching the engine.
 */
import { UPLOADS_DIR } from "./store";
import path from "node:path";

export function getUploadSessionShareId(uploadId: string): string | undefined {
  if (!/^[a-f0-9-]{10,64}$/i.test(uploadId)) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("node:fs").readFileSync(
      path.join(UPLOADS_DIR, `${uploadId}.json`),
      "utf8"
    );
    const session = JSON.parse(raw) as { shareId?: string; status?: string };
    if (session.status !== "active") return undefined;
    return session.shareId;
  } catch {
    return undefined;
  }
}
