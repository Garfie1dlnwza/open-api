import { AUTH_TYPES, CATEGORIES, SOURCES, STATUSES, type AuthType, type Category, type Locale, type Source, type Status } from "@thai-open-api/schema";
import { DEFAULT_SORT, DIRECTIONS, QUERY, SORTS, type Direction, type Sort } from "../config/site.ts";
import { collatorFor } from "./format.ts";
import { searchApis } from "./search.ts";
import type { ApiSummary } from "./summary.ts";

export const FACETS = ["category", "source", "auth", "status"] as const;
export type Facet = (typeof FACETS)[number];

export interface Filters {
  q: string;
  category?: Category;
  source?: Source;
  auth?: AuthType;
  status?: Status;
  sort?: Sort;
  /** Overrides the sort's natural direction; set by clicking a column header twice. */
  dir?: Direction;
}

const pick = <T extends string>(allowed: readonly T[], value: string | null): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

export function parseFilters(params: URLSearchParams): Filters {
  return {
    q: params.get(QUERY.search)?.trim() ?? "",
    category: pick(CATEGORIES, params.get(QUERY.category)),
    source: pick(SOURCES, params.get(QUERY.source)),
    auth: pick(AUTH_TYPES, params.get(QUERY.auth)),
    status: pick(STATUSES, params.get(QUERY.status)),
    sort: pick(SORTS, params.get(QUERY.sort)),
    dir: pick(DIRECTIONS, params.get(QUERY.dir)),
  };
}

/** Defaults are omitted so the URL stays short and shareable. */
export function serializeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set(QUERY.search, filters.q);
  for (const facet of FACETS) {
    const value = filters[facet];
    if (value) params.set(QUERY[facet], value);
  }
  if (filters.sort) params.set(QUERY.sort, filters.sort);
  if (filters.dir) params.set(QUERY.dir, filters.dir);
  return params;
}

/**
 * "Authentication required" is a status, but the Authentication group already says the same thing about the
 * same APIs. One place should speak, so the status filter omits it. Old links with ?status=auth_required still work.
 */
export const STATUS_FACET_VALUES: readonly Status[] = STATUSES.filter((s) => s !== "auth_required");

export type EmptyReason = "query" | "facets" | "both";

/** What to blame when nothing matches: the search text, the chosen filters, or both. null when nothing is applied. */
export function emptyReason(filters: Filters): EmptyReason | null {
  const query = filters.q.trim() !== "";
  const facets = activeFacets(filters).length > 0;
  return query && facets ? "both" : query ? "query" : facets ? "facets" : null;
}

export const activeFacets = (filters: Filters): Facet[] => FACETS.filter((f) => filters[f] !== undefined);

/** Names read A to Z, trust and recency read best first. */
export const NATURAL_DIR: Record<Exclude<Sort, "relevance">, Direction> = { name: "asc", trust: "desc", verified: "desc" };

/** The direction in force, or null for relevance (which has no direction to speak of). */
export function effectiveDir(filters: Filters): Direction | null {
  const sort = effectiveSort(filters);
  return sort === "relevance" ? null : (filters.dir ?? NATURAL_DIR[sort]);
}

/** What a click on a column header does: sort by it, or flip the direction if it is already the sort. */
export function nextSort(filters: Filters, column: Exclude<Sort, "relevance">): Pick<Filters, "sort" | "dir"> {
  if (effectiveSort(filters) !== column) return { sort: column, dir: undefined };
  return { sort: column, dir: effectiveDir(filters) === "asc" ? "desc" : "asc" };
}

/** Without an explicit sort, a query ranks by relevance and browsing sorts by name. */
export const effectiveSort = (filters: Filters): Sort => filters.sort ?? (filters.q ? "relevance" : DEFAULT_SORT);

const matchesFacets = (api: ApiSummary, filters: Filters, skip?: Facet) =>
  FACETS.every((facet) => facet === skip || filters[facet] === undefined || api[facet] === filters[facet]);

export function applyFilters(apis: ApiSummary[], filters: Filters, locale: Locale): ApiSummary[] {
  const { compare } = collatorFor(locale);
  const matched = searchApis(apis, filters.q, locale).filter((api) => matchesFacets(api, filters));
  const sort = effectiveSort(filters);
  if (sort === "relevance") return matched;
  const natural = NATURAL_DIR[sort];
  const flip = (effectiveDir(filters) ?? natural) === natural ? 1 : -1;
  const byName = (x: ApiSummary, y: ApiSummary) => compare(x.name, y.name);
  // Each comparator is written in the sort's natural direction and negated when the visitor flips it.
  const comparators: Record<Exclude<Sort, "relevance">, (x: ApiSummary, y: ApiSummary) => number> = {
    name: byName,
    trust: (x, y) => y.trustScore - x.trustScore || byName(x, y),
    verified: (x, y) => y.reviewedAt.localeCompare(x.reviewedAt) || byName(x, y),
  };
  const sorted = [...matched].sort((x, y) => flip * comparators[sort](x, y));
  return sorted;
}

/** Counts for one facet given every other active filter, so options never promise results that are not there. */
export function facetCounts(apis: ApiSummary[], filters: Filters, facet: Facet, locale: Locale): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const api of searchApis(apis, filters.q, locale)) {
    if (!matchesFacets(api, filters, facet)) continue;
    counts[api[facet]] = (counts[api[facet]] ?? 0) + 1;
  }
  return counts;
}
