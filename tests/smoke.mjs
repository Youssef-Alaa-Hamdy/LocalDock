/**
 * LocalDock — integration smoke tests against a LIVE server.
 * Covers: auth boundaries, permissions, upload/resume/integrity, downloads,
 * range requests, path traversal, pairing, revocation, website hosting.
 *
 * Run: bun tests/smoke.mjs http://localhost:3000
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

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

async function jreq(method, path, { headers = {}, body, raw } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  if (raw) return { status: res.status, res };
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-json */
  }
  return { status: res.status, json, text, res, headers: res.headers };
}

console.log(`\nLocalDock smoke tests → ${BASE}\n`);

/* ------------------------------------------------------------------ */
console.log("1. Bootstrap & identity");
const boot = await jreq("GET", "/api/bootstrap");
check("bootstrap responds 200", boot.status === 200);
const ownerKey = boot.json?.ownerKey;
check("bootstrap provisions owner key", typeof ownerKey === "string" && ownerKey.length >= 32);
const OH = { "X-LocalDock-Owner": ownerKey };

/* ------------------------------------------------------------------ */
console.log("2. Owner API protection");
const sysNoAuth = await jreq("GET", "/api/system");
check("system without owner key -> 401", sysNoAuth.status === 401);
const sysBad = await jreq("GET", "/api/system", { headers: { "X-LocalDock-Owner": "wrong-key" } });
check("system with wrong owner key -> 401", sysBad.status === 401);
const sys = await jreq("GET", "/api/system", { headers: OH });
check("system with owner key -> 200", sys.status === 200);
check("system reports online", sys.json?.online === true);
check("system counts seeded shares", (sys.json?.sharesCount ?? 0) >= 3);

/* ------------------------------------------------------------------ */
console.log("3. Shares registry");
const sharesRes = await jreq("GET", "/api/shares", { headers: OH });
const shares = sharesRes.json?.shares ?? [];
check("shares list >= 4 seeded", shares.length >= 4, `got ${shares.length}`);
const projects = shares.find((s) => s.slug === "projects");
const photos = shares.find((s) => s.slug === "photos");
const documents = shares.find((s) => s.slug === "documents");
const downloads = shares.find((s) => s.slug === "downloads");
check("seeded shares present", !!projects && !!photos && !!documents && !!downloads);
check("Documents is private (no guest)", documents?.guestEnabled === false);
check("Photos is read-only", photos?.access === "read");

const sharesNoAuth = await jreq("GET", "/api/shares");
check("shares list without owner -> 401", sharesNoAuth.status === 401);

/* ------------------------------------------------------------------ */
console.log("4. Browsing & permissions");
const browseOwner = await jreq("GET", `/api/shares/${projects.id}/browse?path=`, { headers: OH });
check("owner can browse Projects", browseOwner.status === 200 && Array.isArray(browseOwner.json?.entries));

const browseGuestDenied = await jreq("GET", `/api/shares/${documents.id}/browse?path=`);
check("guest denied on private share -> 403", browseGuestDenied.status === 403);

const browseGuestOk = await jreq("GET", `/api/shares/${projects.id}/browse?path=`);
check("guest allowed on guest-enabled share", browseGuestOk.status === 200);

const guestInfo = await jreq("GET", "/api/guest/projects");
check("guest slug lookup works", guestInfo.status === 200 && guestInfo.json?.share?.name === "Projects");
const guestInfoPrivate = await jreq("GET", "/api/guest/documents");
check("guest slug lookup on private -> 403", guestInfoPrivate.status === 403);

/* ------------------------------------------------------------------ */
console.log("5. Path traversal & bad input");
const trav1 = await jreq("GET", `/api/shares/${projects.id}/browse?path=${encodeURIComponent("../../..")}`, { headers: OH });
check("traversal in browse rejected", trav1.status === 400);
const trav2 = await jreq("GET", `/api/shares/${projects.id}/browse?path=${encodeURIComponent("/etc")}`, { headers: OH });
check("absolute path in browse rejected", trav2.status === 400);
const trav3 = await jreq("GET", `/api/shares/${projects.id}/download?path=${encodeURIComponent("../../localdock/data/settings.json")}`, { headers: OH });
check("traversal in download rejected", trav3.status === 400);
const badName = await jreq("POST", `/api/shares/${projects.id}/folder`, {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ path: "", name: "../evil" }),
});
check("hostile folder name rejected", badName.status === 400);
const uploadBadName = await jreq("POST", "/api/upload/init", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ shareId: projects.id, dirPath: "", name: "../evil.txt", size: 10 }),
});
check("hostile upload name rejected", uploadBadName.status === 400);

/* ------------------------------------------------------------------ */
console.log("6. Upload engine — chunked, verified");
const CHUNK = 64 * 1024; // server minimum chunk size
const fileA = Buffer.from("LocalDock smoke test payload — ".repeat(9000), "utf8"); // ~276KB
const crypto = await import("node:crypto");
const shaA = crypto.createHash("sha256").update(fileA).digest("hex");

const init1 = await jreq("POST", "/api/upload/init", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ shareId: projects.id, dirPath: "", name: "smoke-test.txt", size: fileA.length, chunkSize: CHUNK }),
});
check("upload init 201", init1.status === 201, JSON.stringify(init1.json));
const { uploadId, totalChunks } = init1.json;
check("chunk math correct", totalChunks === Math.ceil(fileA.length / CHUNK), `got ${totalChunks}`);

let chunkErr = false;
for (let i = 0; i < totalChunks; i++) {
  const slice = fileA.subarray(i * CHUNK, (i + 1) * CHUNK);
  const r = await fetch(`${BASE}/api/upload/chunk?uploadId=${uploadId}&index=${i}`, {
    method: "PUT",
    headers: OH,
    body: new Uint8Array(slice),
  });
  if (r.status !== 200) chunkErr = true;
}
check("all chunks accepted", !chunkErr);

const complete1 = await jreq("POST", "/api/upload/complete", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ uploadId }),
});
check("upload complete -> verified sha256", complete1.json?.upload?.sha256 === shaA);

const browseAfter = await jreq("GET", `/api/shares/${projects.id}/browse?path=`, { headers: OH });
const uploaded = browseAfter.json?.entries?.find((e) => e.name === "smoke-test.txt");
check("uploaded file visible in listing", !!uploaded && uploaded.size === fileA.length);

/* ------------------------------------------------------------------ */
console.log("7. Download & Range");
const dl = await fetch(`${BASE}/api/shares/${projects.id}/download?path=${encodeURIComponent("smoke-test.txt")}`, { headers: OH });
const dlBuf = Buffer.from(await dl.arrayBuffer());
check("download 200 + identical bytes", dl.status === 200 && dlBuf.equals(fileA));
check("download sha256 matches upload", crypto.createHash("sha256").update(dlBuf).digest("hex") === shaA);

const range = await jreq("GET", `/api/shares/${projects.id}/download?path=${encodeURIComponent("smoke-test.txt")}`, {
  headers: { ...OH, Range: "bytes=10-19" },
  raw: true,
});
const rangeBody = Buffer.from(await range.res.arrayBuffer());
check("range request returns 206 + correct slice", range.status === 206 && rangeBody.length === 10 && rangeBody.equals(fileA.subarray(10, 20)));

/* ------------------------------------------------------------------ */
console.log("8. Resume — interrupted upload");
const bigPayload = crypto.randomBytes(CHUNK * 5 + 123); // 6 chunks
const shaBig = crypto.createHash("sha256").update(bigPayload).digest("hex");
const init2 = await jreq("POST", "/api/upload/init", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ shareId: projects.id, dirPath: "", name: "resumable.bin", size: bigPayload.length, chunkSize: CHUNK }),
});
const up2 = init2.json.uploadId;

// send only the first chunk (simulating interruption at ~64KB)
await fetch(`${BASE}/api/upload/chunk?uploadId=${up2}&index=0`, {
  method: "PUT",
  headers: OH,
  body: new Uint8Array(bigPayload.subarray(0, CHUNK)),
});

const status1 = await jreq("GET", `/api/upload/status?uploadId=${up2}`, { headers: OH });
check("status reports 1 received chunk", status1.json?.session?.receivedChunks?.length === 1);

const earlyComplete = await jreq("POST", "/api/upload/complete", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ uploadId: up2 }),
});
check("early complete reports missing chunks", earlyComplete.json?.incomplete === true && earlyComplete.json?.missingChunks?.length === 5);

// resume: send the remaining chunks (client would ask status first)
for (let i = 1; i < 6; i++) {
  await fetch(`${BASE}/api/upload/chunk?uploadId=${up2}&index=${i}`, {
    method: "PUT",
    headers: OH,
    body: new Uint8Array(bigPayload.subarray(i * CHUNK, Math.min(bigPayload.length, (i + 1) * CHUNK))),
  });
}
const complete2 = await jreq("POST", "/api/upload/complete", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ uploadId: up2 }),
});
check("resumed upload completes with correct sha256", complete2.json?.upload?.sha256 === shaBig);

/* ------------------------------------------------------------------ */
console.log("9. Conflict handling & file ops");
const dupInit = await jreq("POST", "/api/upload/init", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ shareId: projects.id, dirPath: "", name: "smoke-test.txt", size: 4, chunkSize: CHUNK }),
});
check("duplicate name auto-renamed", /^smoke-test \(\d+\)\.txt$/.test(dupInit.json?.finalName ?? ""), `got ${dupInit.json?.finalName}`);
await jreq("POST", "/api/upload/cancel", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ uploadId: dupInit.json.uploadId }),
});

const mk = await jreq("POST", `/api/shares/${projects.id}/folder`, {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ path: "", name: "smoke-dir" }),
});
check("create folder 201", mk.status === 201);
const rename = await jreq("PATCH", `/api/shares/${projects.id}/entry`, {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ path: "smoke-dir", name: "smoke-dir-2" }),
});
check("rename works", rename.status === 200);
const rm = await jreq("DELETE", `/api/shares/${projects.id}/entry?path=${encodeURIComponent("smoke-dir-2")}`, { headers: OH });
check("delete works", rm.status === 200);
const hashRes = await jreq("GET", `/api/shares/${projects.id}/hash?path=${encodeURIComponent("smoke-test.txt")}`, { headers: OH });
check("hash endpoint matches", hashRes.json?.sha256 === shaA);

/* ------------------------------------------------------------------ */
console.log("10. Guest write rules");
// Photos is read-only + guest enabled: guest can read, cannot write.
const guestWrite = await jreq("POST", `/api/shares/${photos.id}/folder`, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ path: "", name: "nope" }),
});
check("guest cannot write to read-only share -> 403", guestWrite.status === 403);
const guestBrowse = await jreq("GET", `/api/shares/${photos.id}/browse?path=`);
check("guest can browse read-only share", guestBrowse.status === 200);

/* ------------------------------------------------------------------ */
console.log("11. Pairing & device tokens");
const pairStart = await jreq("POST", "/api/pair/start", { headers: OH });
check("pairing code issued", pairStart.status === 200 && /^[A-Z2-9]{6}$/.test(pairStart.json?.code ?? ""));

const claimBad = await jreq("POST", "/api/pair/claim", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "XXXXXX", deviceName: "Ghost", platform: "test" }),
});
check("invalid pairing code rejected", claimBad.status === 401);

const claim = await jreq("POST", "/api/pair/claim", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: pairStart.json.code, deviceName: "Smoke Phone", platform: "test" }),
});
check("valid code pairs device", claim.status === 200 && claim.json?.deviceToken?.length >= 32);
const deviceToken = claim.json?.deviceToken;
const DH = { "X-LocalDock-Device": deviceToken };

const pairReuse = await jreq("POST", "/api/pair/claim", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: pairStart.json.code, deviceName: "Ghost", platform: "test" }),
});
check("pairing code is single-use", pairReuse.status === 401);

const deviceBrowse = await jreq("GET", `/api/shares/${documents.id}/browse?path=`, { headers: DH });
check("paired device reads private share", deviceBrowse.status === 200);

const deviceWrite = await jreq("POST", `/api/shares/${documents.id}/folder`, {
  headers: { ...DH, "Content-Type": "application/json" },
  body: JSON.stringify({ path: "", name: "nope" }),
});
check("device respects read-only share -> 403", deviceWrite.status === 403);

const devicesList = await jreq("GET", "/api/devices", { headers: OH });
const smokeDevice = devicesList.json?.devices?.find((d) => d.name === "Smoke Phone");
check("device appears in trusted list", !!smokeDevice);

if (smokeDevice) {
  await jreq("DELETE", `/api/devices/${smokeDevice.id}`, { headers: OH });
  const afterRevoke = await jreq("GET", `/api/shares/${documents.id}/browse?path=`, { headers: DH });
  check("revoked token loses access -> 401/403", afterRevoke.status === 401 || afterRevoke.status === 403);
}

/* ------------------------------------------------------------------ */
console.log("12. Website hosting");
const siteGet = await fetch(`${BASE}/sites/portfolio-demo/`);
const siteHtml = await siteGet.text();
check("hosted site serves 200 HTML", siteGet.status === 200 && siteHtml.includes("<!doctype html>"));
check("site serves css", (await fetch(`${BASE}/sites/portfolio-demo/assets/style.css`)).status === 200);
const site404 = await fetch(`${BASE}/sites/portfolio-demo/nonexistent.html`);
check("missing site file -> 404", site404.status === 404);
const siteTrav = await fetch(`${BASE}/sites/portfolio-demo/../../localdock/data/settings.json`);
check("site traversal blocked", siteTrav.status !== 200);
const websites = await jreq("GET", "/api/websites", { headers: OH });
check("websites registry lists demo site", (websites.json?.websites ?? []).some((w) => w.slug === "portfolio-demo"));

/* ------------------------------------------------------------------ */
console.log("13. Malformed requests & resource abuse");
const badChunk = await fetch(`${BASE}/api/upload/chunk?uploadId=nonexistent&index=0`, {
  method: "PUT",
  headers: OH,
  body: new Uint8Array([1, 2, 3]),
});
check("unknown upload session -> 404", badChunk.status === 404);
const badIndex = await fetch(`${BASE}/api/upload/chunk?uploadId=${up2}&index=99999`, {
  method: "PUT",
  headers: OH,
  body: new Uint8Array([1]),
});
check("out-of-range chunk index -> 400/404", badIndex.status === 400 || badIndex.status === 404);
const badBody = await jreq("POST", "/api/shares", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: "not-json{",
});
check("malformed body handled", badBody.status === 400);

/* ------------------------------------------------------------------ */
/* 14. Desktop-only native folder path (web deployments must refuse)     */
/* ------------------------------------------------------------------ */
console.log("\n14. Native folder path (desktop-only)");

const absShare = await jreq("POST", "/api/shares", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Native pick (web)",
    absPath: "/tmp",
    access: "read",
    guestEnabled: false,
  }),
});
check(
  "absPath refused in web mode (native-picker-disabled)",
  absShare.status === 400 && absShare.json?.error?.code === "native-picker-disabled",
  `got ${absShare.status}`
);

const absSite = await jreq("POST", "/api/websites", {
  headers: { ...OH, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Native site (web)", absPath: "/tmp" }),
});
check(
  "absPath refused for websites in web mode",
  absSite.status === 400 && absSite.json?.error?.code === "native-picker-disabled",
  `got ${absSite.status}`
);

/* ------------------------------------------------------------------ */
console.log("\n──────────────────────────────");
console.log(`PASSED: ${passed}   FAILED: ${failed}`);
if (failures.length) {
  console.log("Failures:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log("All LocalDock smoke tests passed.");
}
