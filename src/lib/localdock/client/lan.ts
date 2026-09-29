"use client";

/**
 * LocalDock — LAN address helpers.
 *
 * The desktop (Tauri) webview runs on http://127.0.0.1:<port>, so
 * `location.origin` produces links that only work on the server machine.
 * During boot the app injects the machine's real LAN IPv4 into
 * `window.__LOCALDOCK_LAN_IP__` (from GET /api/bootstrap) and keeps it fresh
 * from the /api/system poll — every share link / QR code must go through
 * buildLanUrl() so other devices on the network can open it.
 *
 * Resolution order inside buildLanUrl:
 *  1. The current host, when it is already reachable over the LAN
 *     (a private IP such as 192.168.x.x or an mDNS name like localdock.local)
 *     — it is the one address this client has proven works.
 *  2. The injected LAN IP (window.__LOCALDOCK_LAN_IP__) with the current
 *     protocol + port — the desktop-webview case (127.0.0.1 / localhost).
 *  3. Plain location.origin as a last resort.
 */

export function getLanIp(): string | null {
  if (typeof window === "undefined") return null;
  return (window as { __LOCALDOCK_LAN_IP__?: string }).__LOCALDOCK_LAN_IP__ ?? null;
}

export function setLanIp(ip: string | null | undefined) {
  if (typeof window === "undefined" || !ip) return;
  (window as { __LOCALDOCK_LAN_IP__?: string }).__LOCALDOCK_LAN_IP__ = ip;
}

function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1" || h === "0.0.0.0";
}

/** Private-range IPv4 (RFC1918 / loopback / link-local 169.254). */
export function isPrivateIpv4(host: string): boolean {
  return (
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/**
 * True when the current origin's host already works from other LAN devices
 * (private IP or a .local mDNS name — anything but loopback).
 */
function hostIsLanReachable(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (!host) return false;
  if (isLoopbackHost(host)) return false;
  if (isPrivateIpv4(host)) return true;
  return host.endsWith(".local"); // mDNS name advertised by the desktop shell
}

/** Build a URL (defaulting to the app root) that other LAN devices can open. */
export function buildLanUrl(p = "/"): string {
  if (typeof window === "undefined") return p;
  const w = window.location;
  const portStr = w.port && w.port !== "80" && w.port !== "443" ? ":" + w.port : "";

  // 1) The current host already works for LAN clients — keep it verbatim.
  if (hostIsLanReachable()) return w.origin + p;

  // 2) Desktop webview / localhost — swap the host for the injected LAN IP.
  const lanIp = getLanIp();
  if (lanIp) return `${w.protocol}//${lanIp}${portStr}${p}`;

  // 3) Nothing better known — current origin.
  return w.origin + p;
}
