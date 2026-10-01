#!/usr/bin/env node
/**
 * LocalDock — post-`tauri android init` patcher.
 *
 * `tauri android init` scaffolds `src-tauri/gen/android` with defaults that
 * assume an internet-facing app. LocalDock is a LAN app whose servers are
 * plain HTTP, so this script (idempotent, safe to re-run) makes the
 * generated project LAN-ready:
 *
 *   1. `android:usesCleartextTraffic="true"` on <application> — Android 9+
 *      blocks cleartext HTTP by default, which would break every
 *      `http://192.168.x.x:3000` connection.
 *   2. `<uses-permission android:name="android.permission.INTERNET"/>` and
 *      `ACCESS_NETWORK_STATE` (INTERNET ships with the template; both are
 *      added only when missing).
 *
 * Wired into `bun run android:init` right after `tauri android init`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "src-tauri", "gen", "android", "app", "src", "main", "AndroidManifest.xml");

function fail(msg) {
  console.error(`\n  ✗ android-init-patch: ${msg}\n`);
  process.exit(1);
}

function info(msg) {
  console.log(`  • ${msg}`);
}

if (!existsSync(MANIFEST)) {
  fail(
    "AndroidManifest.xml not found. Run `bun run tauri android init` first " +
      "(or `bun run android:init`, which chains everything)."
  );
}

let manifest = readFileSync(MANIFEST, "utf8");
let changed = 0;

/* 1. Cleartext traffic — LAN servers are plain HTTP. */
if (manifest.includes('android:usesCleartextTraffic="${usesCleartextTraffic}"')) {
  manifest = manifest.replace(
    'android:usesCleartextTraffic="${usesCleartextTraffic}"',
    'android:usesCleartextTraffic="true"'
  );
  changed += 1;
  info('replaced ${usesCleartextTraffic} with "true"');
} else if (!manifest.includes("android:usesCleartextTraffic")) {
  if (/<application\b[^>]*>/.test(manifest)) {
    manifest = manifest.replace(/<application\b([^>]*)>/, (m, attrs) => {
      const patched = attrs.endsWith("/") ? attrs.slice(0, -1) : attrs;
      return `<application${patched}  android:usesCleartextTraffic="true">`;
    });
    changed += 1;
    info('added android:usesCleartextTraffic="true"');
  } else {
    fail("no <application> tag found in the manifest");
  }
}

if (!manifest.includes("android:networkSecurityConfig")) {
  manifest = manifest.replace(
    /(<application\b[^>]*)/,
    '$1\n        android:networkSecurityConfig="@xml/network_security_config"'
  );
  changed += 1;
  info('added android:networkSecurityConfig="@xml/network_security_config"');
}

/* 2. Permissions. */
const PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
];
for (const permission of PERMISSIONS) {
  if (manifest.includes(`android:name="${permission}"`)) {
    info(`${permission} already present`);
    continue;
  }
  manifest = manifest.replace(
    /(<application\b)/,
    `    <uses-permission android:name="${permission}" />\n    $1`
  );
  changed += 1;
  info(`added <uses-permission ${permission} />`);
}

writeFileSync(MANIFEST, manifest);

console.log(
  changed === 0
    ? "\n  ✓ android manifest already LAN-ready — nothing to do\n"
    : `\n  ✓ patched AndroidManifest.xml (${changed} change${changed === 1 ? "" : "s"})\n`
);
