import type { WorkerCatalog } from "@thai-open-api/schema";
import catalog from "./catalog.generated.json";
import { handle, type Env } from "./handler.ts";

export default {
  fetch: (request: Request, env: Env) => handle(request, env, { catalog: catalog as WorkerCatalog, fetch }),
};
