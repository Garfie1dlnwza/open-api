#!/usr/bin/env node
/**
 * Validates Conventional Commit subjects read from stdin, one per line:
 *   git log --format=%s origin/develop..HEAD | node scripts/check-commits.mjs
 * release-please derives versions and the changelog from these subjects.
 */
import { readFileSync } from "node:fs";

export const TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"];
export const SUBJECT = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9-]+\\))?!?: \\S.{0,99}$`);
const IGNORED = /^(Merge |Revert ")/;

export const invalidSubjects = (subjects) => subjects.filter((s) => s && !IGNORED.test(s) && !SUBJECT.test(s));

if (import.meta.url === `file://${process.argv[1]}`) {
  const bad = invalidSubjects(readFileSync(0, "utf8").split("\n"));
  if (bad.length) {
    console.error(`Commit subjects must look like "type(scope): summary" (types: ${TYPES.join(", ")}):\n`);
    console.error(bad.map((s) => `  - ${s}`).join("\n"));
    process.exit(1);
  }
  console.log("check-commits: ok");
}
