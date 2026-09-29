"use client";

/**
 * LocalDock — desktop shell bridge.
 *
 * The same web UI runs in two worlds:
 *  - Browser: every Tauri call resolves to `null` and callers fall back to
 *    the web behaviour (server-side folder browser, settings-only autostart).
 *  - Windows desktop shell (Tauri v2): the bridge exposes native dialogs,
 *    tray/autostart controls and shell info through typed helpers.
 *
 * Everything is lazy: `@tauri-apps/api` is imported only when actually
 * running inside the shell, so the web bundle never pulls it.
 */

type TauriInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

function internals(): unknown | null {
  if (typeof window === "undefined") return null;
  const w = window as Record<string, unknown>;
  return w.__TAURI_INTERNALS__ ?? w.__TAURI__ ?? null;
}

/** True when the UI is running inside the Tauri desktop shell. */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Record<string, unknown>;
  return !!(w.__TAURI_INTERNALS__ || w.__TAURI__ || w.__LOCALDOCK_DESKTOP__);
}

/**
 * Server-confirmed desktop mode (bootstrap.desktop && Tauri present).
 * Falls back to Tauri detection before bootstrap completes.
 */
export function desktopMode(): boolean {
  return isDesktop();
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isDesktop()) return null;
  const core = await import("@tauri-apps/api/core");
  return (core.invoke as TauriInvoke)(cmd, args) as Promise<T | null>;
}

/* ---------------- native folder picker ---------------- */

/**
 * Open the OS-native folder picker. Returns an absolute path, or null when
 * the user cancels — or when not running in the desktop shell.
 */
export async function pickNativeFolder(title: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const w = window as Record<string, unknown>;

  if (isDesktop()) {
    try {
      const tauriObj = w.__TAURI__ as { dialog?: { open?: (opts: unknown) => Promise<unknown> } } | undefined;
      if (typeof tauriObj?.dialog?.open === "function") {
        const picked = await tauriObj.dialog.open({
          directory: true,
          multiple: false,
          title,
        });
        return typeof picked === "string" ? picked : null;
      }
      const dialog = await import("@tauri-apps/plugin-dialog");
      const picked = await dialog.open({
        directory: true,
        multiple: false,
        title,
      });
      return typeof picked === "string" ? picked : null;
    } catch (err) {
      console.warn("Tauri folder picker error:", err);
    }
  }
  return null;
}

/* ---------------- shell commands ---------------- */

export interface DesktopStatus {
  port: number;
  url: string;
  lanUrls: string[];
  serverPid: number | null;
  mdnsOn: boolean;
  startWithWindows: boolean;
}

export const Desktop = {
  status: () => invoke<DesktopStatus>("desktop_status"),

  /** Sync the Windows "Start with Windows" entry (registry, via plugin). */
  setStartWithWindows: (enabled: boolean) =>
    invoke<boolean>("set_start_with_windows", { enabled }),

  /** Open the server URL in the user's default browser. */
  openInBrowser: () => invoke<boolean>("open_in_browser"),

  /** Re-announce the server on the local network (mDNS). */
  announce: () => invoke<boolean>("announce_mdns"),
};
