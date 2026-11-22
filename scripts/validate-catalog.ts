import { loadCatalog } from "../packages/schema/src/node.ts";

const entries = loadCatalog();
console.log(`catalog: ${entries.length} APIs valid`);
