import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  appendHistory,
  buildRequest,
  evaluateEndpoint,
  fetchWithRedirects,
  policyFromEntry,
  rollupStatus,
  type ApiEntry,
  type ApiHealth,
  type Endpoint,
  type EndpointHealth,
  type Observation,
  type StatusFile,
} from "../packages/schema/src/index.ts";
import { loadCatalog, loadStatus, PATHS } from "../packages/schema/src/node.ts";

const CONCURRENCY = 4;
const HEALTH_ACCEPT = "application/json, application/xml;q=0.9, text/plain;q=0.8, */*;q=0.1";

const TLS_ERROR_CODE = /CERT|SSL|TLS|ISSUER|SIGNATURE/;

function classifyError(error: unknown): "timeout" | "network" | "tls" {
  if (error instanceof DOMException && error.name === "TimeoutError") return "timeout";
  const code = String((error as { cause?: { code?: string } }).cause?.code ?? "");
  return TLS_ERROR_CODE.test(code) ? "tls" : "network";
}

async function observe(api: ApiEntry, url: URL, headers: Record<string, string>): Promise<Observation> {
  const started = performance.now();
  try {
    const res = await fetchWithRedirects(policyFromEntry(api), url, headers, fetch, HEALTH_ACCEPT);
    if (!res) return { error: "redirect_blocked", latencyMs: Math.round(performance.now() - started) };
    const body = await res.text();
    return { httpStatus: res.status, latencyMs: Math.round(performance.now() - started), body };
  } catch (error) {
    return { error: classifyError(error), latencyMs: Math.round(performance.now() - started) };
  }
}

async function checkEndpoint(api: ApiEntry, endpoint: Endpoint, checkedAt: string): Promise<EndpointHealth> {
  // Keyless on purpose: we never hold third-party credentials, so keyed APIs report auth_required.
  const built = buildRequest(api, endpoint, endpoint.example);
  if (!built.ok) throw new Error(`${api.id}/${endpoint.id}: invalid example (${built.name}: ${built.message})`);
  return evaluateEndpoint(api, endpoint, await observe(api, built.url, built.headers), checkedAt);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

const checkedAt = new Date().toISOString();
const previous = loadStatus();
const entries = loadCatalog();

const apis = await mapLimit(entries, CONCURRENCY, async (api): Promise<[string, ApiHealth]> => {
  const endpoints = await Promise.all(api.endpoints.map((e) => checkEndpoint(api, e, checkedAt)));
  const status = rollupStatus(endpoints.map((e) => e.status));
  const latencies = endpoints.flatMap((e) => (e.latencyMs === undefined ? [] : [e.latencyMs]));
  const latencyMs = latencies.length ? Math.max(...latencies) : undefined;
  const history = appendHistory(previous.apis[api.id]?.history, { t: checkedAt, status, latencyMs });
  return [api.id, { status, checkedAt, latencyMs, endpoints, history }];
});

const file: StatusFile = { generatedAt: checkedAt, apis: Object.fromEntries(apis) };
mkdirSync(dirname(PATHS.status), { recursive: true });
writeFileSync(PATHS.status, `${JSON.stringify(file, null, 2)}\n`);

for (const [id, health] of apis) {
  const reasons = health.endpoints.map((e) => e.reason).join(",");
  console.log(`${health.status.padEnd(13)} ${String(health.latencyMs ?? "-").padStart(5)}ms  ${id}  (${reasons})`);
}
