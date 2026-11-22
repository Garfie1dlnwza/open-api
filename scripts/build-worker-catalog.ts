import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toWorkerCatalog } from "../packages/schema/src/index.ts";
import { loadCatalog, PATHS } from "../packages/schema/src/node.ts";

const catalog = toWorkerCatalog(loadCatalog());
mkdirSync(dirname(PATHS.workerCatalog), { recursive: true });
writeFileSync(PATHS.workerCatalog, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`worker catalog: ${Object.keys(catalog).length} APIs -> ${PATHS.workerCatalog}`);
