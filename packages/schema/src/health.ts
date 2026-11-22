import { HEALTH, HTTP, MS_PER_HOUR, type HealthReason, type Status } from "./constants.ts";
import type { ApiEntry, Endpoint, HealthCheck } from "./entry.ts";

export interface EndpointHealth {
  endpointId: string;
  status: Status;
  reason: HealthReason;
  checkedAt: string;
  httpStatus?: number;
  latencyMs?: number;
  /** true when the catalog's own example request returned a well-formed 2xx response. */
  exampleVerified: boolean;
}

export interface HistoryPoint {
  t: string;
  status: Status;
  latencyMs?: number;
}

export interface ApiHealth {
  status: Status;
  checkedAt: string;
  latencyMs?: number;
  endpoints: EndpointHealth[];
  history: HistoryPoint[];
}

export interface StatusFile {
  generatedAt: string;
  apis: Record<string, ApiHealth>;
}

export interface Observation {
  /** Present when no HTTP response arrived at all. */
  error?: "timeout" | "network";
  httpStatus?: number;
  latencyMs: number;
  body?: string;
}

const is2xx = (status: number) => status >= HTTP.ok && status < HTTP.ok + 100;

function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => {
    if (cur === null || typeof cur !== "object") return undefined;
    return (cur as Record<string, unknown>)[key];
  }, value);
}

const typeMatches = (value: unknown, type: string) =>
  type === "array" ? Array.isArray(value) : type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : typeof value === type;

/** Returns true when the check passes. A 200 alone proves nothing, so the body is inspected. */
function runCheck(check: HealthCheck, body: string, json: unknown): boolean {
  if (check.kind === "text") return body.includes(check.contains);
  const value = getPath(json, check.path);
  if (!typeMatches(value, check.type)) return false;
  return check.minItems === undefined || (Array.isArray(value) && value.length >= check.minItems);
}

export function evaluateEndpoint(
  api: Pick<ApiEntry, "auth">,
  endpoint: Pick<Endpoint, "id" | "health" | "response">,
  obs: Observation,
  checkedAt: string,
): EndpointHealth {
  const base = { endpointId: endpoint.id, checkedAt, httpStatus: obs.httpStatus, latencyMs: obs.latencyMs, exampleVerified: false };
  const result = (status: Status, reason: HealthReason): EndpointHealth => ({ ...base, status, reason });

  if (obs.error) return result("outage", obs.error);
  const http = obs.httpStatus ?? 0;

  if (http === HTTP.unauthorized || http === HTTP.forbidden) {
    return api.auth.type === "apiKey" ? result("auth_required", "auth_required") : result("outage", "unexpected_auth");
  }
  if (http === HTTP.tooManyRequests) return result("degraded", "rate_limited");
  if (!is2xx(http)) return result("outage", "http_error");

  const body = obs.body ?? "";
  let json: unknown;
  if (endpoint.response.format === "json") {
    try {
      json = JSON.parse(body);
    } catch {
      return result("outage", "not_json");
    }
  }

  const failed = endpoint.health.checks.filter((c) => !runCheck(c, body, json));
  if (failed.some((c) => !c.optional)) return result("outage", "schema_mismatch");

  const verified = { ...base, exampleVerified: true };
  if (failed.length > 0) return { ...verified, status: "degraded", reason: "optional_check_failed" };
  if (obs.latencyMs > (endpoint.health.slowMs ?? HEALTH.slowMs)) return { ...verified, status: "degraded", reason: "slow" };
  return { ...verified, status: "operational", reason: "ok" };
}

/** Roll endpoint results up to one API-level status. */
export function rollupStatus(statuses: Status[]): Status {
  const known = statuses.filter((s) => s !== "unknown");
  if (known.length === 0) return "unknown";
  if (known.every((s) => s === "outage")) return "outage";
  if (known.some((s) => s === "outage" || s === "degraded")) return "degraded";
  if (known.every((s) => s === "auth_required")) return "auth_required";
  return "operational";
}

/** Old results must not keep claiming "operational": past the stale window it is unknown. */
export function effectiveStatus(health: ApiHealth | undefined, now: Date): Status {
  if (!health) return "unknown";
  const ageHours = (now.getTime() - Date.parse(health.checkedAt)) / MS_PER_HOUR;
  return Number.isFinite(ageHours) && ageHours <= HEALTH.staleHours ? health.status : "unknown";
}

export function appendHistory(previous: HistoryPoint[] | undefined, point: HistoryPoint): HistoryPoint[] {
  return [...(previous ?? []), point].slice(-HEALTH.historyLength);
}

/** Share of samples that were up, ignoring auth-gated/unknown ones; null with too little data. */
export function uptimeRatio(history: HistoryPoint[]): number | null {
  const counted = history.filter((h) => h.status !== "unknown" && h.status !== "auth_required");
  if (counted.length < HEALTH.minHistoryForStability) return null;
  return counted.filter((h) => h.status === "operational" || h.status === "degraded").length / counted.length;
}
