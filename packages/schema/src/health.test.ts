import { describe, expect, it } from "vitest";
import { makeEntry } from "./fixtures.ts";
import { appendHistory, effectiveStatus, evaluateEndpoint, rollupStatus, uptimeRatio, type ApiHealth } from "./health.ts";

const api = makeEntry();
const endpoint = api.endpoints[0];
const keyedApi = makeEntry({ auth: { type: "apiKey", in: "header", name: "X-Key", signupUrl: "https://portal.example.go.th" } });
const NOW = "2026-11-22T00:00:00.000Z";
const run = (obs: Parameters<typeof evaluateEndpoint>[2], target = api) => evaluateEndpoint(target, endpoint, obs, NOW);

describe("evaluateEndpoint", () => {
  it("is operational only when the body has the expected shape", () => {
    const result = run({ httpStatus: 200, latencyMs: 120, body: '{"data":[1]}' });
    expect(result).toMatchObject({ status: "operational", reason: "ok", exampleVerified: true });
  });

  it("does not trust HTTP 200 with a wrong or empty payload", () => {
    expect(run({ httpStatus: 200, latencyMs: 50, body: '{"data":[]}' })).toMatchObject({ status: "outage", reason: "schema_mismatch", exampleVerified: false });
    expect(run({ httpStatus: 200, latencyMs: 50, body: '{"error":"maintenance"}' })).toMatchObject({ status: "outage", reason: "schema_mismatch" });
    expect(run({ httpStatus: 200, latencyMs: 50, body: "<html>login</html>" })).toMatchObject({ status: "outage", reason: "not_json" });
  });

  it("is degraded when slow or rate limited", () => {
    expect(run({ httpStatus: 200, latencyMs: 9000, body: '{"data":[1]}' })).toMatchObject({ status: "degraded", reason: "slow" });
    expect(run({ httpStatus: 429, latencyMs: 40 })).toMatchObject({ status: "degraded", reason: "rate_limited" });
  });

  it("is an outage on network failure, timeout and server errors", () => {
    expect(run({ error: "timeout", latencyMs: 10000 })).toMatchObject({ status: "outage", reason: "timeout" });
    expect(run({ error: "network", latencyMs: 5 })).toMatchObject({ status: "outage", reason: "network" });
    expect(run({ httpStatus: 503, latencyMs: 30 })).toMatchObject({ status: "outage", reason: "http_error" });
  });

  it("reports auth_required for keyed APIs but an outage when a keyless API asks for auth", () => {
    expect(run({ httpStatus: 401, latencyMs: 30 }, keyedApi)).toMatchObject({ status: "auth_required", exampleVerified: false });
    expect(run({ httpStatus: 401, latencyMs: 30 })).toMatchObject({ status: "outage", reason: "unexpected_auth" });
  });
});

describe("rollupStatus", () => {
  it("combines endpoint statuses", () => {
    expect(rollupStatus([])).toBe("unknown");
    expect(rollupStatus(["outage", "outage"])).toBe("outage");
    expect(rollupStatus(["operational", "outage"])).toBe("degraded");
    expect(rollupStatus(["auth_required", "auth_required"])).toBe("auth_required");
    expect(rollupStatus(["operational", "unknown"])).toBe("operational");
  });
});

describe("effectiveStatus", () => {
  const health = { status: "operational", checkedAt: NOW, endpoints: [], history: [] } satisfies ApiHealth;
  it("expires stale results to unknown", () => {
    expect(effectiveStatus(health, new Date("2026-11-22T10:00:00Z"))).toBe("operational");
    expect(effectiveStatus(health, new Date("2026-11-30T00:00:00Z"))).toBe("unknown");
    expect(effectiveStatus(undefined, new Date(NOW))).toBe("unknown");
  });
});

describe("history", () => {
  it("keeps a bounded window and needs enough samples for uptime", () => {
    const point = (status: "operational" | "outage") => ({ t: NOW, status });
    let history = appendHistory(undefined, point("operational"));
    expect(uptimeRatio(history)).toBeNull();
    for (let i = 0; i < 59; i++) history = appendHistory(history, point(i % 2 ? "operational" : "outage"));
    expect(history).toHaveLength(30);
    expect(uptimeRatio(history)).toBeCloseTo(0.5, 1);
  });
});
