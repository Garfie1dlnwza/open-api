import { MS_PER_DAY, TRUST } from "./constants.ts";
import type { ApiEntry } from "./entry.ts";
import { effectiveStatus, uptimeRatio, type ApiHealth } from "./health.ts";

export const TRUST_FACTORS = ["source", "docs", "license", "freshness", "stability", "example"] as const;
export type TrustFactorId = (typeof TRUST_FACTORS)[number];
export type FactorState = "pass" | "partial" | "fail" | "unknown";
export type TrustLevel = "high" | "medium" | "low";

export interface TrustFactor {
  id: TrustFactorId;
  points: number;
  max: number;
  state: FactorState;
}
export interface TrustScore {
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
}

const stateOf = (points: number, max: number): FactorState => (points >= max ? "pass" : points > 0 ? "partial" : "fail");

export function computeTrust(api: ApiEntry, health: ApiHealth | undefined, now: Date): TrustScore {
  const factor = (id: TrustFactorId, points: number, state?: FactorState): TrustFactor => ({
    id,
    points: Math.round(points),
    max: TRUST.max[id],
    state: state ?? stateOf(points, TRUST.max[id]),
  });

  const licenseOk = api.license.verified && (api.license.type === "open" || api.license.type === "terms");
  const licenseDeclared = api.license.type !== "unknown";
  const ageDays = (now.getTime() - Date.parse(api.reviewedAt)) / MS_PER_DAY;
  const freshness = ageDays <= TRUST.freshDays ? TRUST.max.freshness : ageDays <= TRUST.staleDays ? TRUST.freshnessPartial : 0;

  const uptime = health ? uptimeRatio(health.history) : null;
  const fresh = effectiveStatus(health, now) !== "unknown";
  const verifiedExamples = fresh && health ? health.endpoints.filter((e) => e.exampleVerified).length : 0;

  const factors = [
    factor("source", TRUST.sourcePoints[api.source]),
    factor("docs", api.docsUrl ? TRUST.max.docs : 0),
    factor("license", licenseOk ? TRUST.max.license : licenseDeclared ? TRUST.licensePartial : 0),
    factor("freshness", freshness),
    uptime === null ? factor("stability", 0, "unknown") : factor("stability", uptime * TRUST.max.stability),
    factor("example", (verifiedExamples / api.endpoints.length) * TRUST.max.example),
  ];

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const level: TrustLevel = score >= TRUST.levels.high ? "high" : score >= TRUST.levels.medium ? "medium" : "low";
  return { score, level, factors };
}
