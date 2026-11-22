import type { ApiSummary } from "./summary.ts";

const WEIGHT = { name: 5, id: 4, provider: 3, tags: 3, endpoints: 2, category: 2, description: 1 } as const;
const PREFIX_BONUS = 3;

const normalize = (value: string) => value.normalize("NFC").toLowerCase();
export const tokenize = (query: string): string[] => normalize(query).split(/\s+/).filter(Boolean);

function fields(api: ApiSummary): [keyof typeof WEIGHT, string][] {
  return [
    ["name", normalize(api.name)],
    ["id", api.id],
    ["provider", normalize(api.provider)],
    ["tags", normalize(api.tags.join(" "))],
    ["endpoints", normalize(api.endpoints.map((e) => `${e.title} ${e.path}`).join(" "))],
    ["category", normalize(api.categoryLabel)],
    ["description", normalize(api.description)],
  ];
}

/** 0 means "does not match". Every term must hit at least one field (AND). Thai has no spaces, so plain substring matching is used. */
export function scoreApi(api: ApiSummary, terms: string[]): number {
  if (terms.length === 0) return 1;
  const haystack = fields(api);
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [field, text] of haystack) {
      const at = text.indexOf(term);
      if (at === -1) continue;
      best = Math.max(best, WEIGHT[field] + (at === 0 ? PREFIX_BONUS : 0));
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function searchApis(apis: ApiSummary[], query: string): ApiSummary[] {
  const terms = tokenize(query);
  return apis
    .map((api) => ({ api, score: scoreApi(api, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.api.name.localeCompare(b.api.name))
    .map((r) => r.api);
}
