/**
 * Unit tests for LocalDock path-security core (the most security-critical module).
 * Run: bun test tests/unit
 */
import { describe, test, expect } from "bun:test";
import {
  resolveSafe,
  resolveSafeInside,
  sanitizeName,
  sanitizeUploadName,
  slugify,
  validateSlug,
  categoryOf,
  mimeOf,
} from "../../src/lib/localdock/paths";
import { parseRange } from "../../src/lib/localdock/files";
import { currentSpeedBps, recordBytes } from "../../src/lib/localdock/metrics";

const ROOT = "/srv/localdock/Shares/Projects";

describe("resolveSafe — path traversal", () => {
  test("accepts simple relative paths", () => {
    const r = resolveSafe(ROOT, "docs/readme.md");
    expect(r.ok).toBe(true);
    expect(r.abs).toBe("/srv/localdock/Shares/Projects/docs/readme.md");
  });

  test("accepts root itself", () => {
    const r = resolveSafe(ROOT, "");
    expect(r.ok).toBe(true);
    expect(r.rel).toBe("");
  });

  test("rejects classic ../ traversal", () => {
    expect(resolveSafe(ROOT, "../secret.txt").ok).toBe(false);
  });

  test("rejects deep traversal", () => {
    expect(resolveSafe(ROOT, "a/b/../../../../etc/passwd").ok).toBe(false);
  });

  test("rejects absolute paths", () => {
    expect(resolveSafe(ROOT, "/etc/passwd").ok).toBe(false);
  });

  test("rejects windows drive paths", () => {
    expect(resolveSafe(ROOT, "C:\\Windows\\system32").ok).toBe(false);
  });

  test("rejects null bytes", () => {
    expect(resolveSafe(ROOT, "file\u0000.txt").ok).toBe(false);
  });

  test("rejects backslash traversal attempts", () => {
    expect(resolveSafe(ROOT, "..\\..\\secret").ok).toBe(false);
  });

  test("normalizes embedded single-dots", () => {
    const r = resolveSafe(ROOT, "./docs/./x.txt");
    expect(r.ok).toBe(true);
    expect(r.rel).toBe("docs/x.txt");
  });

  test("resolveSafeInside rejects root itself", () => {
    expect(resolveSafeInside(ROOT, "").ok).toBe(false);
    expect(resolveSafeInside(ROOT, "file.txt").ok).toBe(true);
  });
});

describe("sanitizeName", () => {
  test("accepts normal names", () => {
    expect(sanitizeName("my report.txt")).toBe("my report.txt");
  });

  test("rejects traversal names", () => {
    expect(sanitizeName("../evil")).toBe(null);
    expect(sanitizeName("..")).toBe(null);
    expect(sanitizeName(".")).toBe(null);
  });

  test("sanitizes slashes into underscores", () => {
    expect(sanitizeName("a/b")).toBe("a_b");
  });

  test("rejects null bytes entirely", () => {
    expect(sanitizeName("bad\u0000name")).toBe(null);
  });

  test("rejects hidden dotfiles", () => {
    expect(sanitizeName(".env")).toBe(null);
  });

  test("rejects windows reserved names", () => {
    expect(sanitizeName("CON")).toBe(null);
    expect(sanitizeName("NUL.txt")).toBe(null);
  });

  test("strips trailing dots", () => {
    expect(sanitizeName("file.txt...")).toBe("file.txt");
  });

  test("upload name keeps extension", () => {
    expect(sanitizeUploadName("holiday photo.jpg")).toBe("holiday photo.jpg");
    expect(sanitizeUploadName("x/../../etc/passwd")).not.toContain("..");
  });
});

describe("slugify / validateSlug", () => {
  test("basic slug", () => {
    expect(slugify("My Projects!")).toBe("my-projects");
  });
  test("reserved slugs rejected", () => {
    expect(validateSlug("api")).toBe(false);
    expect(validateSlug("sites")).toBe(false);
  });
  test("valid slug accepted", () => {
    expect(validateSlug("my-share-1")).toBe(true);
  });
});

describe("category & mime", () => {
  test("categories", () => {
    expect(categoryOf("photo.JPG")).toBe("image");
    expect(categoryOf("clip.mkv")).toBe("video");
    expect(categoryOf("song.mp3")).toBe("audio");
    expect(categoryOf("doc.pdf")).toBe("pdf");
    expect(categoryOf("app.apk")).toBe("apk");
    expect(categoryOf("backup.zip")).toBe("archive");
    expect(categoryOf("notes.md")).toBe("text");
    expect(categoryOf("index.html")).toBe("code");
    expect(categoryOf("data.bin")).toBe("other");
  });
  test("mimes", () => {
    expect(mimeOf("x.png")).toBe("image/png");
    expect(mimeOf("y.html")).toContain("text/html");
    expect(mimeOf("z.unknown")).toBe("application/octet-stream");
  });
});

describe("parseRange", () => {
  test("full open range", () => {
    expect(parseRange("bytes=0-", 1000)).toEqual({ start: 0, end: 999 });
  });
  test("mid range", () => {
    expect(parseRange("bytes=100-199", 1000)).toEqual({ start: 100, end: 199 });
  });
  test("suffix range", () => {
    expect(parseRange("bytes=-200", 1000)).toEqual({ start: 800, end: 999 });
  });
  test("end clamps to size-1", () => {
    expect(parseRange("bytes=500-99999", 1000)).toEqual({ start: 500, end: 999 });
  });
  test("invalid ranges rejected", () => {
    expect(parseRange("bytes=1000-", 1000)).toBeUndefined(); // start >= size
    expect(parseRange("bytes=200-100", 1000)).toBeUndefined(); // start > end
    expect(parseRange("malformed", 1000)).toBeUndefined();
    expect(parseRange(null, 1000)).toBeUndefined();
  });
});

describe("metrics", () => {
  test("speed reflects recent bytes", () => {
    recordBytes(1_000_000);
    const speed = currentSpeedBps();
    expect(speed).toBeGreaterThan(0);
  });
});
