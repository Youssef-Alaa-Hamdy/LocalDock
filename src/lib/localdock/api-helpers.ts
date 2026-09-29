/**
 * LocalDock — API route helpers (auth guards, body parsing, errors).
 */
import { getAuth, isOwner, type ShareAction } from "./auth";
import { jsonError } from "./files";
import type { Share } from "./types";
import { getShare } from "./registry";
import { logActivity } from "./registry";
import { canAccessShare } from "./auth";

export async function requireOwner(req: Request): Promise<Response | null> {
  const auth = getAuth(req);
  if (!isOwner(auth)) {
    return jsonError(401, "unauthorized", "This operation requires the LocalDock owner console.");
  }
  return null;
}

export async function shareGuard(
  req: Request,
  shareId: string,
  action: ShareAction
): Promise<{ share: Share } | { deny: Response }> {
  const share = getShare(shareId);
  if (!share) {
    return { deny: jsonError(404, "share-not-found", "This shared folder no longer exists.") };
  }
  const auth = getAuth(req);
  if (!canAccessShare(auth, share, action)) {
    void logActivity("security.denied", `Denied ${action} on “${share.name}”`, {
      identity: auth.kind,
    });
    return {
      deny: jsonError(
        403,
        "forbidden",
        share.guestEnabled
          ? "Your access level does not allow this action on this folder."
          : "This folder is private. Pair your device or ask the owner to enable guest access."
      ),
    };
  }
  return { share };
}

export async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
