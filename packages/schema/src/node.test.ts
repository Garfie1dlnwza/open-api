import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findRoot, loadStatus } from "./node.ts";

const makeDir = (pkgName?: string) => {
  const dir = mkdtempSync(join(tmpdir(), "toa-root-"));
  mkdirSync(join(dir, "catalog"));
  mkdirSync(join(dir, "packages", "schema"), { recursive: true });
  if (pkgName) writeFileSync(join(dir, "package.json"), JSON.stringify({ name: pkgName }));
  return dir;
};

describe("findRoot", () => {
  it("accepts only a directory whose package.json is this repository's", () => {
    const real = makeDir("thai-open-api");
    mkdirSync(join(real, "apps", "web"), { recursive: true });
    expect(findRoot(join(real, "apps", "web"), undefined)).toBe(real);
  });

  it("ignores look-alike directories that merely contain catalog/ and packages/schema", () => {
    expect(() => findRoot(makeDir(), undefined)).toThrow(/Could not find/);
    expect(() => findRoot(makeDir("something-else"), undefined)).toThrow(/Could not find/);
  });

  it("validates a pinned root too", () => {
    const real = makeDir("thai-open-api");
    expect(findRoot("/", real)).toBe(real);
    expect(() => findRoot("/", makeDir("other"))).toThrow(/not a thai-open-api checkout/);
  });
});

describe("loadStatus", () => {
  const write = (content: string) => {
    const dir = mkdtempSync(join(tmpdir(), "toa-status-"));
    const file = join(dir, "status.json");
    writeFileSync(file, content);
    return file;
  };
  const now = "2026-11-22T00:00:00.000Z";

  it("returns validated data", () => {
    const file = write(JSON.stringify({ generatedAt: now, apis: { demo: { status: "operational", checkedAt: now, endpoints: [], history: [] } } }));
    expect(loadStatus(file).apis.demo.status).toBe("operational");
  });

  it("treats missing, malformed or hostile files as no data instead of failing the build", () => {
    expect(loadStatus(join(tmpdir(), "does-not-exist.json")).apis).toEqual({});
    expect(loadStatus(write("not json")).apis).toEqual({});
    expect(loadStatus(write(JSON.stringify({ generatedAt: now, apis: { demo: { status: "<script>", checkedAt: now, endpoints: [], history: [] } } }))).apis).toEqual({});
  });
});
