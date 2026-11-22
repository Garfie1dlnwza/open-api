import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { ApiEntrySchema, type ApiEntry } from "./entry.ts";
import type { StatusFile } from "./health.ts";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
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
