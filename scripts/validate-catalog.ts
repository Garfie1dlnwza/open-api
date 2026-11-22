import { CatalogError, loadCatalog } from "../packages/schema/src/node.ts";

try {
  console.log(`catalog: ${loadCatalog().length} APIs valid`);
} catch (error) {
  // A bad catalog is a content mistake, not a crash: print the list of problems, not a stack trace.
  if (!(error instanceof CatalogError)) throw error;
  console.error(error.message);
  process.exit(1);
}
