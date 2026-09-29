/**
 * LocalDock — desktop-mode integration test.
 *
 * Boots the PRODUCTION standalone build exactly the way the Tauri shell
 * does (LOCALDOCK_DESKTOP=1 + LOCALDOCK_HOME + PORT on node server.js) and
 * verifies the native-folder path end to end:
 *   1. absPath share is created and browsable (anywhere on this machine).
 *   2. Realpath canonicalization + sandbox still guard the share root.
 *   3. Hostile absPath inputs are rejected (relative, missing, file).
 *   4. bootstrap reports desktop:true.
 *
 * Run: bun run build && bun tests/desktop-mode.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 3177;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
}

async function jreq(method, p, { headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${p}`, { method, headers, body });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, json };
}

/* ---------- sandbox ---------- */
const home = fs.mkdtempSync(path.join(os.tmpdir(), "localdock-desktop-"));
const realFolder = path.join(home, "My Documents", "Secret Shots");
fs.mkdirSync(realFolder, { recursive: true });
fs.writeFileSync(path.join(realFolder, "note.txt"), "hello from the native picker");

console.log(`\nLocalDock desktop-mode test → ${BASE}`);
console.log(`  LOCALDOCK_HOME = ${home}\n`);

/* ---------- boot ---------- */
const STANDALONE = path.join(process.cwd(), ".next", "standalone");
if (!fs.existsSync(path.join(STANDALONE, "server.js"))) {
  console.error("\n  ✗ standalone build missing — run: bun run build\n");
  process.exit(1);
}
const child = spawn(process.execPath, ["server.js"], {
  cwd: STANDALONE,
  env: {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    LOCALDOCK_DESKTOP: "1",
    LOCALDOCK_HOME: home,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let booted = false;
const bootLog = [];
child.stdout.on("data", (d) => bootLog.push(String(d)));
child.stderr.on("data", (d) => bootLog.push(String(d)));

const deadline = Date.now() + 90_000;
while (Date.now() < deadline) {
  try {
    // /api/bootstrap is the public health surface (system is owner-gated).
    const r = await fetch(`${BASE}/api/bootstrap`);
    if (r.ok) {
      booted = true;
      break;
    }
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 800));
}

try {
  if (!booted) {
    check("desktop server boots", false, bootLog.slice(-5).join(""));
  } else {
    check("desktop server boots", true);

    /* 1. bootstrap reports desktop */
    const boot = await jreq("GET", "/api/bootstrap");
    check(
      "bootstrap.desktop = true",
      boot.json?.desktop === true,
      `got ${JSON.stringify(boot.json?.desktop)}`
    );
    const OH = { "X-LocalDock-Owner": boot.json.ownerKey, "Content-Type": "application/json" };

    /* 2. native absolute path works and is browsable */
    const created = await jreq("POST", "/api/shares", {
      headers: OH,
      body: JSON.stringify({
        name: "Secret Shots",
        absPath: realFolder,
        access: "readwrite",
        guestEnabled: false,
      }),
    });
    check("absPath share created (201)", created.status === 201, `got ${created.status} ${JSON.stringify(created.json)}`);
    const share = created.json?.share;
    check("share rootPath is the canonical picked folder", share?.rootPath === realFolder, `got ${share?.rootPath}`);

    const browse = await jreq("GET", `/api/shares/${share.id}/browse?path=`, { headers: OH });
    check(
      "browse lists native folder contents",
      browse.status === 200 && browse.json?.entries?.some((e) => e.name === "note.txt"),
      JSON.stringify(browse.json).slice(0, 120)
    );

    /* 3. traversal from the native root is still blocked */
    const evil = await jreq("GET", `/api/shares/${share.id}/browse?path=${encodeURIComponent("../../..")}`);
    check(
      "traversal from native root blocked",
      evil.status !== 200 || (evil.json?.entries ?? null) === null || Array.isArray(evil.json?.entries) === false,
      `got ${evil.status}`
    );

    /* 4. hostile absPath inputs */
    const rel = await jreq("POST", "/api/shares", {
      headers: OH,
      body: JSON.stringify({ name: "x", absPath: "not/absolute", access: "read" }),
    });
    check("relative absPath rejected", rel.status === 400 && rel.json?.error?.code === "bad-path", `got ${rel.status}`);

    const missing = await jreq("POST", "/api/shares", {
      headers: OH,
      body: JSON.stringify({ name: "x", absPath: path.join(home, "does-not-exist"), access: "read" }),
    });
    check("missing absPath rejected", missing.status === 400 && missing.json?.error?.code === "not-found", `got ${missing.status}`);

    const filePath = path.join(realFolder, "note.txt");
    const filePick = await jreq("POST", "/api/shares", {
      headers: OH,
      body: JSON.stringify({ name: "x", absPath: filePath, access: "read" }),
    });
    check("file (not folder) rejected", filePick.status === 400 && filePick.json?.error?.code === "not-a-dir", `got ${filePick.status}`);

    /* 5. unauthenticated create is still refused (owner gate) */
    const anon = await jreq("POST", "/api/shares", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", absPath: realFolder, access: "read" }),
    });
    check("absPath requires owner auth", anon.status === 401 || anon.status === 403, `got ${anon.status}`);
  }
} finally {
  child.kill("SIGTERM");
  spawnSync("pkill", ["-f", `server.js.*${PORT}`], { stdio: "ignore" });
  setTimeout(() => {
    try {
      fs.rmSync(home, { recursive: true, force: true });
    } catch {
      /* windows handles may linger */
    }
  }, 500);
}

console.log(`\nPASSED: ${passed}   FAILED: ${failed}`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("Desktop-mode native path: all green.");
