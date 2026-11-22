import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs without types
import { invalidSubjects } from "./check-commits.mjs";

describe("check-commits", () => {
  it("accepts conventional subjects, breaking markers and merges", () => {
    expect(invalidSubjects(["feat: add x", "fix(worker): handle y", "feat(web)!: drop z", "Merge branch 'develop' into main", ""])).toEqual([]);
  });
  it("rejects everything else", () => {
    expect(invalidSubjects(["added stuff", "Feat: caps", "fix:no space", "fix(Bad Scope): x"])).toHaveLength(4);
  });
});
