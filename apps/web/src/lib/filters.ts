import { AUTH_TYPES, CATEGORIES, SOURCES, STATUSES, type AuthType, type Category, type Locale, type Source, type Status } from "@thai-open-api/schema";
import { DEFAULT_SORT, QUERY, SORTS, type Sort } from "../config/site.ts";
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
  return params;
}

export const activeFacets = (filters: Filters): Facet[] => FACETS.filter((f) => filters[f] !== undefined);

/** Without an explicit sort, a query ranks by relevance and browsing sorts by name. */
export const effectiveSort = (filters: Filters): Sort => filters.sort ?? (filters.q ? "relevance" : DEFAULT_SORT);

const matchesFacets = (api: ApiSummary, filters: Filters, skip?: Facet) =>
  FACETS.every((facet) => facet === skip || filters[facet] === undefined || api[facet] === filters[facet]);

export function applyFilters(apis: ApiSummary[], filters: Filters, locale: Locale): ApiSummary[] {
  const { compare } = collatorFor(locale);
  const matched = searchApis(apis, filters.q, locale).filter((api) => matchesFacets(api, filters));
  const sort = effectiveSort(filters);
  if (sort === "relevance") return matched;
  const sorted = [...matched];
  if (sort === "name") sorted.sort((a, b) => compare(a.name, b.name));
  if (sort === "trust") sorted.sort((a, b) => b.trustScore - a.trustScore || compare(a.name, b.name));
  if (sort === "verified") sorted.sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt) || compare(a.name, b.name));
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
