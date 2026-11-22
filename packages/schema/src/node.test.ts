import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findRoot } from "./node.ts";

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
