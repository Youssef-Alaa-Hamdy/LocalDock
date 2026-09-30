/**
 * LocalDock — API route helpers (auth guards, body parsing, errors).
 */
import { getAuth, isOwner, type ShareAction } from "./auth";
import { jsonError } from "./files";
import type { AuthContext, Share } from "./types";
import { getShare } from "./registry";
import { logActivity } from "./registry";
import { canAccessShare } from "./auth";
import { resolveLinkToken } from "./link-tokens";

export async function requireOwner(req: Request): Promise<Response | null> {
  const auth = getAuth(req);
  if (!isOwner(auth)) {
    return jsonError(
      401,
      "unauthorized",
      "This operation requires the LocalDock owner console.",
      { key: "unauthorized" }
    );
  }
  return null;
}

export async function shareGuard(
  req: Request,
  shareId: string,
  action: ShareAction
): Promise<{ share: Share; auth: AuthContext } | { deny: Response }> {
  const share = getShare(shareId);
  if (!share) {
    return {
      deny: jsonError(
        404,
        "share-not-found",
        "This shared folder no longer exists.",
        { key: "shareNotFound" }
      ),
    };
  }
  const auth = getAuth(req);
  let effectiveAuth: AuthContext = auth;
  if (auth.kind === "none") {
    // Header-less media loads (<img>/<video>/<iframe> src) authenticate via a
    // short-lived share-scoped link token (?t=…) issued to an authorized
    // identity — the token inherits exactly that identity's access.
    const token = new URL(req.url).searchParams.get("t") ?? "";
    const tokenAuth = token ? resolveLinkToken(token, shareId) : null;
    if (tokenAuth) effectiveAuth = tokenAuth;
  }
  if (!canAccessShare(effectiveAuth, share, action)) {
    void logActivity(
      "security.denied",
      `Denied ${action} on “${share.name}”`,
      { identity: effectiveAuth.kind },
      { key: "denied", params: { action: String(action), name: share.name } }
    );
    return {
      deny: jsonError(
        403,
        "forbidden",
        share.guestEnabled
          ? "Your access level does not allow this action on this folder."
          : "This folder is private. Pair your device or ask the owner to enable guest access.",
        { key: share.guestEnabled ? "forbidden" : "privateFolder" }
      ),
    };
  }
  return { share, auth: effectiveAuth };
}

export async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
