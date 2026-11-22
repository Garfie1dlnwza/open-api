import { execFileSync } from "node:child_process";
import rootPackage from "../../../../package.json";

/** Short commit of the checkout being built, or null when git is not available (e.g. a source tarball). */
function readCommit(): string | null {
  try {
    const out = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return /^[0-9a-f]{7,40}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

/** Facts about this build, shown in the footer so anyone can tell exactly which version they are looking at. */
export const BUILD = {
  version: rootPackage.version,
  commit: readCommit(),
  year: new Date().getUTCFullYear(),
} as const;
