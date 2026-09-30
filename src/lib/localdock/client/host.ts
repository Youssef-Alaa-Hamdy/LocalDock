"use client";

/**
 * LocalDock — host vs. companion-device detection.
 *
 * "Select folder" flows must behave differently depending on WHERE the
 * browser runs:
 *  - On the host machine (localhost, or the Tauri desktop shell): the app may
 *    browse the computer's real drives — those folders are local to the
 *    server, so sharing them directly is free and instant.
 *  - On any other device (phone / laptop over LAN): browsing the server's
 *    drives is wrong and confusing — the user wants to pick folders from
 *    THEIR OWN device and upload them to the computer.
 *
 * Detection is hostname-based: only the machine running the server resolves
 * "localhost" to the server itself. A phone visiting http://192.168.1.3:3000
 * sees the LAN IP as hostname, so it is correctly treated as a companion
 * device. The desktop (Tauri) shell always counts as the host.
 */
export function isHostMachine(): boolean {
  if (typeof window === "undefined") return true; // SSR: no UI depends on it
  const host = window.location.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".localhost")
  ) {
    return true;
  }
  // Desktop shell (Tauri) is always the host, whatever URL it loads from.
  const w = window as unknown as Record<string, unknown>;
  return !!(w.__TAURI_INTERNALS__ || w.__TAURI__ || w.__LOCALDOCK_DESKTOP__);
}
