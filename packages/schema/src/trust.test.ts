import { describe, expect, it } from "vitest";
import { makeEntry } from "./fixtures.ts";
import type { ApiHealth, HistoryPoint } from "./health.ts";
import { computeTrust } from "./trust.ts";

const now = new Date("2026-11-22T00:00:00Z");
const history = (n: number): HistoryPoint[] => Array.from({ length: n }, () => ({ t: now.toISOString(), status: "operational" as const }));
const health = (n: number): ApiHealth => ({
  status: "operational",
  checkedAt: now.toISOString(),
  history: history(n),
  endpoints: [{ endpointId: "rates", status: "operational", reason: "ok", checkedAt: now.toISOString(), exampleVerified: true }],
});
const points = (score: ReturnType<typeof computeTrust>, id: string) => score.factors.find((f) => f.id === id);

describe("computeTrust", () => {
  it("gives a well-documented, verified, stable official API the top level", () => {
    const trust = computeTrust(makeEntry(), health(30), now);
    expect(trust.score).toBe(100);
    expect(trust.level).toBe("high");
  });

  it("does not credit stability without enough history and says so", () => {
    const trust = computeTrust(makeEntry(), health(2), now);
    expect(points(trust, "stability")).toMatchObject({ points: 0, state: "unknown" });
  });

  it("scores an unverified unofficial API with no docs as low", () => {
    const entry = makeEntry({ source: "unofficial", docsUrl: undefined, license: { type: "unknown" }, reviewedAt: "2025-01-01" });
    const trust = computeTrust(entry, undefined, now);
    expect(trust.level).toBe("low");
    expect(trust.score).toBe(0);
  });

  it("credits a declared but unverified licence only partially", () => {
    const trust = computeTrust(makeEntry({ license: { type: "terms", verified: false } }), undefined, now);
    expect(points(trust, "license")).toMatchObject({ points: 6, state: "partial" });
  });

  it("ignores example verification from stale health data", () => {
    const stale = { ...health(30), checkedAt: "2026-11-01T00:00:00.000Z" };
    expect(points(computeTrust(makeEntry(), stale, now), "example")?.points).toBe(0);
  });
});
