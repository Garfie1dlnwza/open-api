import {
  AUTH_LOCATIONS,
  computeTrust,
  effectiveStatus,
  localize,
  LOCALES,
  type ApiEntry,
  type ApiHealth,
  type Locale,
  type StatusFile,
  type TrustScore,
} from "@thai-open-api/schema";
import { loadCatalog, loadStatus } from "@thai-open-api/schema/node";
import { createT } from "../i18n/index.ts";
import { formatDate, formatShortDate } from "./format.ts";
import type { ApiSummary } from "./summary.ts";

export interface Catalog {
  entries: ApiEntry[];
  status: StatusFile;
  now: Date;
}

let cached: Catalog | undefined;

/** Build-time only: reads catalog/*.yaml and data/status.json once per build. */
export function getCatalog(): Catalog {
  cached ??= { entries: loadCatalog(), status: loadStatus(), now: new Date() };
  return cached;
}

export const getEntry = (id: string): ApiEntry => {
  const entry = getCatalog().entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown API "${id}"`);
  return entry;
};

export const getHealth = (id: string): ApiHealth | undefined => getCatalog().status.apis[id];

export const getTrust = (entry: ApiEntry): TrustScore => computeTrust(entry, getHealth(entry.id), getCatalog().now);

export function toSummary(entry: ApiEntry, locale: Locale): ApiSummary {
  const { now } = getCatalog();
  const t = createT(locale);
  const trust = getTrust(entry);
  return {
    id: entry.id,
    name: localize(entry.name, locale),
    provider: localize(entry.provider.name, locale),
    description: localize(entry.description, locale),
    category: entry.category,
    categoryLabel: t(`category.${entry.category}`),
    source: entry.source,
    auth: entry.auth.type,
    license: { type: entry.license.type, verified: entry.license.verified },
    tags: entry.tags,
    status: effectiveStatus(getHealth(entry.id), now),
    reviewedAt: entry.reviewedAt,
    verifiedLabel: formatDate(entry.reviewedAt, locale),
    verifiedShort: formatShortDate(entry.reviewedAt, locale),
    aliases: LOCALES.filter((l) => l !== locale).flatMap((l) => [localize(entry.name, l), localize(entry.provider.name, l)]),
    trustScore: trust.score,
    trustLevel: trust.level,
    endpoints: entry.endpoints.map((e) => ({ title: localize(e.title, locale), path: e.path })),
  };
}

export const getSummaries = (locale: Locale): ApiSummary[] => getCatalog().entries.map((e) => toSummary(e, locale));

export const authLocationKey = (location: (typeof AUTH_LOCATIONS)[number]) =>
  location === "header" ? ("api.locationHeader" as const) : ("api.locationQuery" as const);

/** Per-endpoint view that never claims more than the (possibly stale) health data supports. */
export function endpointHealth(apiId: string, endpointId: string) {
  const { now } = getCatalog();
  const health = getHealth(apiId);
  if (effectiveStatus(health, now) === "unknown") return { status: "unknown" as const, exampleVerified: false };
  const result = health?.endpoints.find((e) => e.endpointId === endpointId);
  return { status: result?.status ?? ("unknown" as const), exampleVerified: result?.exampleVerified ?? false };
}
