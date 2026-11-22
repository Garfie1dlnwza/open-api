import {
  CATEGORIES,
  HEALTH,
  SOURCES,
  STATUSES,
  effectiveStatus,
  type ApiEntry,
  type Category,
  type HistoryPoint,
  type Source,
  type Status,
  type StatusFile,
} from "@thai-open-api/schema";

export interface TrendPoint {
  t: string;
  value: number;
}
export interface Incident {
  id: string;
  status: Status;
  /** Probes where the API was down / slow, and of all counted probes. `bad` is their sum. */
  outage: number;
  degraded: number;
  bad: number;
  of: number;
}
export interface DashboardData {
  /** ISO time of the newest probe run, or null when there is no health data at all. */
  latestCheck: string | null;
  checks: number;
  kpis: {
    apis: number;
    endpoints: number;
    availability: number | null;
    availabilityDelta: number | null;
    /** APIs that answered / APIs that could be checked in the latest run (key-gated ones are not countable). */
    availabilityOf: { up: number; total: number } | null;
    medianLatencyMs: number | null;
    /** Change of the median since the previous run, in ms. */
    latencyDelta: number | null;
    /** How many APIs the latest median is taken over. */
    latencySamples: number;
    licensesVerified: number;
  };
  availabilityTrend: TrendPoint[];
  latencyTrend: TrendPoint[];
  endpointHealth: Record<Status, number>;
  byCategory: { category: Category; count: number }[];
  bySource: { source: Source; count: number }[];
  license: { verified: number; declared: number; unknown: number };
  /** How many APIs can be called straight away and how many need a key. */
  access: { open: number; apiKey: number };
  incidents: Incident[];
}

const PERCENT = 100;
const MAX_INCIDENTS = 5;
/** Auth-gated and unknown results say nothing about whether an API is up. */
const countable = (p: HistoryPoint) => p.status !== "unknown" && p.status !== "auth_required";
const isUp = (p: HistoryPoint) => p.status !== "outage";
/** A failed probe's elapsed time is a timeout, not a response time, so it never enters the latency figures. */
const answered = (p: HistoryPoint): p is HistoryPoint & { latencyMs: number } => isUp(p) && p.latencyMs !== undefined;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Everything the dashboard shows, derived from the catalog and the health file. No sample data. */
export function computeDashboard(entries: ApiEntry[], status: StatusFile, now: Date): DashboardData {
  const known = new Set(entries.map((e) => e.id));

  // One probe run shares one timestamp across all APIs, so group history points by it.
  const runs = new Map<string, HistoryPoint[]>();
  for (const [id, health] of Object.entries(status.apis)) {
    if (!known.has(id)) continue;
    for (const point of health.history) runs.set(point.t, [...(runs.get(point.t) ?? []), point]);
  }
  const ordered = [...runs.entries()].sort(([a], [b]) => Date.parse(a) - Date.parse(b)).slice(-HEALTH.historyLength);

  const availabilityTrend: TrendPoint[] = [];
  const latencyTrend: TrendPoint[] = [];
  let latestRun: { up: number; total: number } | null = null;
  let latencySamples = 0;
  for (const [t, points] of ordered) {
    const counted = points.filter(countable);
    if (counted.length === 0) continue;
    availabilityTrend.push({ t, value: (counted.filter(isUp).length / counted.length) * PERCENT });
    latestRun = { up: counted.filter(isUp).length, total: counted.length };
    const latencies = counted.filter(answered).map((p) => p.latencyMs);
    latencySamples = latencies.length;
    const latency = median(latencies);
    if (latency !== null) latencyTrend.push({ t, value: Math.round(latency) });
  }

  const endpointHealth = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const entry of entries) {
    const health = status.apis[entry.id];
    const fresh = effectiveStatus(health, now) !== "unknown";
    for (const endpoint of entry.endpoints) {
      const result = fresh ? health?.endpoints.find((e) => e.endpointId === endpoint.id) : undefined;
      endpointHealth[result?.status ?? "unknown"]++;
    }
  }

  const incidents = entries
    .flatMap((entry): Incident[] => {
      const history = (status.apis[entry.id]?.history ?? []).filter(countable);
      const outage = history.filter((p) => p.status === "outage").length;
      const degraded = history.filter((p) => p.status === "degraded").length;
      const bad = outage + degraded;
      return bad > 0 ? [{ id: entry.id, status: effectiveStatus(status.apis[entry.id], now), outage, degraded, bad, of: history.length }] : [];
    })
    .sort((a, b) => b.bad - a.bad || b.bad / b.of - a.bad / a.of || a.id.localeCompare(b.id))
    .slice(0, MAX_INCIDENTS);

  const verified = entries.filter((e) => e.license.verified && (e.license.type === "open" || e.license.type === "terms")).length;
  const declared = entries.filter((e) => e.license.type !== "unknown").length - verified;
  const last = availabilityTrend.at(-1);
  const previous = availabilityTrend.at(-2);
  const latencyNow = latencyTrend.at(-1);
  const latencyBefore = latencyTrend.at(-2);

  return {
    latestCheck: ordered.at(-1)?.[0] ?? null,
    checks: ordered.length,
    kpis: {
      apis: entries.length,
      endpoints: entries.reduce((n, e) => n + e.endpoints.length, 0),
      availability: last ? Math.round(last.value * 10) / 10 : null,
      availabilityDelta: last && previous ? Math.round((last.value - previous.value) * 10) / 10 : null,
      availabilityOf: latestRun,
      medianLatencyMs: latencyNow?.value ?? null,
      latencyDelta: latencyNow && latencyBefore ? latencyNow.value - latencyBefore.value : null,
      latencySamples,
      licensesVerified: verified,
    },
    availabilityTrend,
    latencyTrend,
    endpointHealth,
    byCategory: CATEGORIES.map((category) => ({ category, count: entries.filter((e) => e.category === category).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
    bySource: SOURCES.map((source) => ({ source, count: entries.filter((e) => e.source === source).length })).filter((s) => s.count > 0),
    license: { verified, declared: Math.max(declared, 0), unknown: entries.length - verified - Math.max(declared, 0) },
    access: { open: entries.filter((e) => e.auth.type === "none").length, apiKey: entries.filter((e) => e.auth.type === "apiKey").length },
    incidents,
  };
}
