/**
 * LocalDock — first-run bootstrap.
 * Provisions the home directory layout and server identity.
 * No sample files or folders are created — the user starts with a clean slate.
 */
import { ensureHomeLayout } from "./store";
import { getSettings } from "./registry";

export async function ensureSeeded(): Promise<void> {
  ensureHomeLayout();
  getSettings(); // provision serverId + ownerKey on first run
}
