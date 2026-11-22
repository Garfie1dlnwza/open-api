import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, parse as parsePath } from "node:path";
import { parse } from "yaml";
import { ApiEntrySchema, type ApiEntry } from "./entry.ts";
import type { StatusFile } from "./health.ts";

/**
 * Repo root, found by walking up from the working directory. Not derived from import.meta.url,
 * because bundlers (Astro/Vite) move this module into a build output directory.
 */
function findRoot(start: string): string {
  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(join(dir, "catalog")) && existsSync(join(dir, "packages", "schema"))) return dir;
    if (dir === parsePath(dir).root) throw new Error(`Could not find the repository root above ${start}`);
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

export function loadStatus(file: string = PATHS.status): StatusFile {
  if (!existsSync(file)) return { generatedAt: new Date(0).toISOString(), apis: {} };
  return JSON.parse(readFileSync(file, "utf8")) as StatusFile;
}
