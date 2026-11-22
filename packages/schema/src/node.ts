import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, parse as parsePath } from "node:path";
import { parse } from "yaml";
import { ApiEntrySchema, type ApiEntry } from "./entry.ts";
import type { StatusFile } from "./health.ts";
import { StatusFileSchema } from "./status-schema.ts";

const ROOT_ENV = "THAI_OPEN_API_ROOT";
const PACKAGE_NAME = "thai-open-api";

const isRepoRoot = (dir: string): boolean => {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name?: string };
    return pkg.name === PACKAGE_NAME && existsSync(join(dir, "catalog"));
  } catch {
    return false;
  }
};

/**
 * Repo root, found by walking up from `start` to the first directory whose package.json is this
 * repository's. Not derived from import.meta.url (bundlers move this module), and not accepted
 * from any directory that merely happens to contain a catalog/ folder. THAI_OPEN_API_ROOT can pin it.
 */
export function findRoot(start: string, pinned: string | undefined = process.env[ROOT_ENV]): string {
  if (pinned) {
    if (!isRepoRoot(pinned)) throw new Error(`${ROOT_ENV}=${pinned} is not a ${PACKAGE_NAME} checkout`);
    return pinned;
  }
  for (let dir = start; ; dir = dirname(dir)) {
    if (isRepoRoot(dir)) return dir;
    if (dir === parsePath(dir).root) throw new Error(`Could not find the ${PACKAGE_NAME} repository root above ${start}`);
  }
}

const ROOT = findRoot(process.cwd());
export const PATHS = {
  root: ROOT,
  catalog: join(ROOT, "catalog"),
  status: join(ROOT, "data", "status.json"),
  workerCatalog: join(ROOT, "apps", "worker", "src", "catalog.generated.json"),
} as const;

export class CatalogError extends Error {}

/** Loads and validates every catalog/*.yaml. Throws one error listing every problem. */
export function loadCatalog(dir: string = PATHS.catalog): ApiEntry[] {
  const problems: string[] = [];
  const entries: ApiEntry[] = [];
  const ids = new Set<string>();

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort()) {
    const parsed = ApiEntrySchema.safeParse(parse(readFileSync(join(dir, file), "utf8")));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) problems.push(`${file}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      continue;
    }
    if (parsed.data.id !== file.replace(/\.yaml$/, "")) problems.push(`${file}: id "${parsed.data.id}" must match the file name`);
    if (ids.has(parsed.data.id)) problems.push(`${file}: duplicate id "${parsed.data.id}"`);
    ids.add(parsed.data.id);
    entries.push(parsed.data);
  }
  if (problems.length) throw new CatalogError(`Invalid catalog:\n  ${problems.join("\n  ")}`);
  return entries;
}

const EMPTY_STATUS = (): StatusFile => ({ generatedAt: new Date(0).toISOString(), apis: {} });

/** Reads data/status.json. A missing or malformed file means "no data" (everything Unknown), never a failed build. */
export function loadStatus(file: string = PATHS.status): StatusFile {
  if (!existsSync(file)) return EMPTY_STATUS();
  try {
    const parsed = StatusFileSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
    if (parsed.success) return parsed.data as StatusFile;
    console.error(`Ignoring ${file}: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  } catch (error) {
    console.error(`Ignoring ${file}: ${(error as Error).message}`);
  }
  return EMPTY_STATUS();
}
