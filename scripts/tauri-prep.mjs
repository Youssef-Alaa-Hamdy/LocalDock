#!/usr/bin/env node
/**
 * LocalDock — assembles the Tauri bundle resources.
 *
 * What goes where (relative to src-tauri/resources):
 *   server/          <- .next/standalone (server.js + minimal node_modules)
 *   server/.next     <- + compiled app (from .next/standalone/.next)
 *   server/.next/static  <- client assets (copied here like the web build)
 *   server/public    <- static public assets
 *   bin/node.exe     <- official Windows node runtime (downloaded once)
 *
 * Run via `bun run tauri:prep` (wired as beforeBuildCommand in tauri.conf.json).
 */

import { existsSync, mkdirSync, rmSync, cpSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "src-tauri", "resources");
const SERVER_RES = join(RES, "server");
const NODE_EXE = join(RES, "bin", "node.exe");

/** Node LTS for Windows — matches the runtime the app is developed against. */
const NODE_VERSION = process.env.LOCALDOCK_NODE_VERSION ?? "22.14.0";
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/win-x64/node.exe`;

function fail(msg) {
  console.error(`\n  ✗ tauri-prep: ${msg}\n`);
  process.exit(1);
}

async function downloadNode() {
  if (existsSync(NODE_EXE)) {
    console.log("  • node.exe already present — skipping download");
    return;
  }
  mkdirSync(dirname(NODE_EXE), { recursive: true });
  console.log(`  • downloading node.exe v${NODE_VERSION} (win-x64)…`);
  try {
    const res = await fetch(NODE_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(NODE_EXE, buf);
    console.log(`  ✓ node.exe (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  } catch (e) {
    fail(
      `could not download node.exe (${e.message}). ` +
        `Set LOCALDOCK_NODE_EXE to a local node.exe path or check your connection.`
    );
  }
}

async function main() {
  console.log("\nLocalDock — preparing Tauri resources\n");

  // 1. The web build must exist.
  const standalone = join(ROOT, ".next", "standalone");
  if (!existsSync(join(standalone, "server.js"))) {
    fail(`Next.js standalone build not found at ${standalone}. Run: bun run build`);
  }

  // 2. Copy the standalone server (clean slate each time).
  console.log("  • copying standalone server → src-tauri/resources/server");
  rmSync(SERVER_RES, { recursive: true, force: true });
  mkdirSync(SERVER_RES, { recursive: true });
  cpSync(standalone, SERVER_RES, { recursive: true });

  // 3. Static + public assets (same layout as the web `start` script).
  const staticDir = join(ROOT, ".next", "static");
  if (existsSync(staticDir)) {
    cpSync(staticDir, join(SERVER_RES, ".next", "static"), { recursive: true });
    console.log("  ✓ .next/static copied");
  } else {
    fail(".next/static missing — run bun run build again.");
  }
  const publicDir = join(ROOT, "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, join(SERVER_RES, "public"), { recursive: true });
    console.log("  ✓ public/ copied");
  }

  // 4. The Windows node runtime.
  if (process.env.LOCALDOCK_NODE_EXE && existsSync(process.env.LOCALDOCK_NODE_EXE)) {
    mkdirSync(dirname(NODE_EXE), { recursive: true });
    cpSync(process.env.LOCALDOCK_NODE_EXE, NODE_EXE);
    console.log("  ✓ node.exe copied from LOCALDOCK_NODE_EXE");
  } else {
    await downloadNode();
  }

  const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(1);
  console.log(`\n  ✓ resources ready (server.js ${mb(join(SERVER_RES, "server.js"))} MB, node.exe ${mb(NODE_EXE)} MB)\n`);
}

main().catch((e) => fail(e?.stack ?? e?.message ?? String(e)));
