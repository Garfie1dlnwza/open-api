import { makeEntry } from "@thai-open-api/schema/fixtures";
import type { ApiHealth, HistoryPoint, StatusFile } from "@thai-open-api/schema";
import { describe, expect, it } from "vitest";
import { computeDashboard } from "./dashboard.ts";

const NOW = new Date("2026-11-22T12:00:00.000Z");
const iso = (hour: number) => `2026-11-22T${String(hour).padStart(2, "0")}:00:00.000Z`;
const point = (hour: number, status: HistoryPoint["status"], latencyMs?: number): HistoryPoint => ({ t: iso(hour), status, latencyMs });
const health = (history: HistoryPoint[], status: ApiHealth["status"] = "operational"): ApiHealth => ({
  status,
  checkedAt: iso(11),
  history,
  endpoints: [{ endpointId: "rates", status, reason: "ok", checkedAt: iso(11), exampleVerified: status === "operational" }],
});

const a = makeEntry({ id: "alpha", category: "finance", source: "official" });
const b = makeEntry({ id: "beta", category: "finance", source: "community", license: { type: "terms", verified: false } });
const c = makeEntry({ id: "gamma", category: "energy", source: "unofficial", license: { type: "unknown" } });

describe("computeDashboard", () => {
  it("counts the catalog without any health data", () => {
    const data = computeDashboard([a, b, c], { generatedAt: iso(0), apis: {} }, NOW);
    expect(data.kpis).toMatchObject({ apis: 3, endpoints: 3, availability: null, medianLatencyMs: null, licensesVerified: 1 });
    expect(data.byCategory).toEqual([{ category: "finance", count: 2 }, { category: "energy", count: 1 }]);
    expect(data.bySource.map((s) => s.source)).toEqual(["official", "community", "unofficial"]);
    expect(data.license).toEqual({ verified: 1, declared: 1, unknown: 1 });
    expect(data.endpointHealth.unknown).toBe(3);
    expect(data.availabilityTrend).toEqual([]);
    expect(data.checks).toBe(0);
  });

  it("builds trends per probe run, ignoring auth-gated and unknown results", () => {
    const status: StatusFile = {
      generatedAt: iso(11),
      apis: {
        alpha: health([point(9, "operational", 100), point(10, "outage"), point(11, "operational", 200)]),
        beta: health([point(9, "operational", 300), point(10, "operational", 100), point(11, "degraded", 400)]),
        gamma: health([point(9, "auth_required", 50), point(10, "unknown"), point(11, "auth_required", 50)], "auth_required"),
      },
    };
    const data = computeDashboard([a, b, c], status, NOW);
    expect(data.availabilityTrend.map((p) => p.value)).toEqual([100, 50, 100]);
    expect(data.latencyTrend.map((p) => p.value)).toEqual([200, 100, 300]);
    expect(data.kpis.availability).toBe(100);
    expect(data.kpis.availabilityDelta).toBe(50);
    expect(data.kpis.medianLatencyMs).toBe(300);
    expect(data.checks).toBe(3);
    expect(data.latestCheck).toBe(iso(11));
  });

  it("never lets a failed probe's elapsed time into the latency figures", () => {
    const status: StatusFile = {
      generatedAt: iso(11),
      apis: {
        alpha: health([point(9, "operational", 100), point(10, "outage", 30_000), point(11, "operational", 200)]),
        beta: health([point(9, "operational", 300), point(10, "operational", 100), point(11, "operational", 400)]),
        gamma: health([point(9, "auth_required", 50), point(10, "auth_required", 50), point(11, "auth_required", 50)], "auth_required"),
      },
    };
    const data = computeDashboard([a, b, c], status, NOW);
    // Run 10 would be 15,050 ms if alpha's 30 s timeout counted; with only beta's answer it is 100.
    expect(data.latencyTrend.map((p) => p.value)).toEqual([200, 100, 300]);
    expect(data.kpis.latencyDelta).toBe(200);
    expect(data.kpis.latencySamples).toBe(2);
    expect(data.kpis.availabilityOf).toEqual({ up: 2, total: 2 });
  });

  it("reports how many APIs the availability figure is over, and the access split", () => {
    const keyed = makeEntry({ id: "delta", auth: { type: "apiKey", in: "header", name: "api-key", signupUrl: "https://example.go.th/signup" } });
    const status: StatusFile = {
      generatedAt: iso(11),
      apis: {
        alpha: health([point(11, "outage")]),
        beta: health([point(11, "operational", 100)]),
        delta: health([point(11, "auth_required")], "auth_required"),
      },
    };
    const data = computeDashboard([a, b, keyed], status, NOW);
    expect(data.kpis.availabilityOf).toEqual({ up: 1, total: 2 });
    expect(data.access).toEqual({ open: 2, apiKey: 1 });
  });

  it("splits incidents into outages and slow responses", () => {
    const status: StatusFile = {
      generatedAt: iso(11),
      apis: { alpha: health([point(9, "outage"), point(10, "degraded", 9000), point(11, "outage")]) },
    };
    expect(computeDashboard([a], status, NOW).incidents).toMatchObject([{ id: "alpha", outage: 2, degraded: 1, bad: 3, of: 3 }]);
  });

  it("ranks incidents by how often an API failed or was slow", () => {
    const status: StatusFile = {
      generatedAt: iso(11),
      apis: {
        alpha: health([point(9, "outage"), point(10, "outage"), point(11, "operational", 1)]),
        beta: health([point(9, "operational", 1), point(10, "degraded", 9000), point(11, "operational", 1)]),
        gamma: health([point(9, "operational", 1), point(10, "operational", 1), point(11, "operational", 1)]),
      },
    };
    const { incidents } = computeDashboard([a, b, c], status, NOW);
    expect(incidents.map((i) => [i.id, i.bad, i.of])).toEqual([["alpha", 2, 3], ["beta", 1, 3]]);
  });

  it("does not show stale endpoint results as healthy, and ignores APIs that left the catalog", () => {
    const stale = { ...health([point(9, "operational", 1)]), checkedAt: "2026-11-01T00:00:00.000Z" };
    const status: StatusFile = { generatedAt: iso(11), apis: { alpha: stale, removed: health([point(9, "outage")]) } };
    const data = computeDashboard([a], status, NOW);
    expect(data.endpointHealth.operational).toBe(0);
    expect(data.endpointHealth.unknown).toBe(1);
    expect(data.availabilityTrend).toHaveLength(1);
    expect(data.incidents).toEqual([]);
  });
});
