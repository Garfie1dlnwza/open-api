import type { Locale } from "@thai-open-api/schema";
import { collatorFor } from "./format.ts";
import type { ApiSummary } from "./summary.ts";

const WEIGHT = { name: 5, id: 4, provider: 3, tags: 3, aliases: 3, endpoints: 2, category: 2, description: 1 } as const;
const PREFIX_BONUS = 3;
const MIN_COMPACT_TERM = 2;
const THAI = /[\u0E00-\u0E7F]/;

const normalize = (value: string) => value.normalize("NFC").toLowerCase();
const WORD_CHAR = /[\p{L}\p{N}]/u;
/** Letters and digits only, so "PM25" finds "pm2.5"; `starts` maps each kept character back to its place in the text. */
function compact(value: string): { flat: string; starts: number[] } {
  const starts: number[] = [];
  let flat = "";
  for (let i = 0; i < value.length; i++) {
    if (WORD_CHAR.test(value[i])) {
      flat += value[i];
      starts.push(i);
    }
  }
  return { flat, starts };
}
export const tokenize = (query: string): string[] => normalize(query).split(/\s+/).filter(Boolean);

function fields(api: ApiSummary): [keyof typeof WEIGHT, string][] {
  return [
    ["name", normalize(api.name)],
    ["id", api.id],
    ["provider", normalize(api.provider)],
    ["tags", normalize(api.tags.join(" "))],
    ["aliases", normalize(api.aliases.join(" "))],
    ["endpoints", normalize(api.endpoints.map((e) => `${e.title} ${e.path}`).join(" "))],
    ["category", normalize(api.categoryLabel)],
    ["description", normalize(api.description)],
  ];
}

/**
 * Where `term` matches in `text`, or -1. Latin terms must start a word ("air" does not match "fairly");
 * Thai has no spaces between words, so any substring counts. Falls back to punctuation-insensitive matching.
 */
/** A word starts after a non-word character, or where letters turn into digits ("pm" then "2.5"). */
const startsWord = (text: string, at: number, term: string): boolean =>
  at === 0 || THAI.test(term) || !WORD_CHAR.test(text[at - 1]) || (/\p{N}/u.test(term[0]) && /\p{L}/u.test(text[at - 1]));

function matchAt(text: string, term: string): number {
  for (let at = text.indexOf(term); at !== -1; at = text.indexOf(term, at + 1)) {
    if (startsWord(text, at, term)) return at;
  }
  const flatTerm = compact(term).flat;
  if (flatTerm.length < MIN_COMPACT_TERM) return -1;
  const { flat, starts } = compact(text);
  // Punctuation-insensitive hits must still begin a word of the original text ("air" is not in "fairly").
  for (let at = flat.indexOf(flatTerm); at !== -1; at = flat.indexOf(flatTerm, at + 1)) {
    const original = starts[at];
    if (startsWord(text, original, term)) return original;
  }
  return -1;
}

/** 0 means "does not match". Every term must hit at least one field (AND). */
export function scoreApi(api: ApiSummary, terms: string[]): number {
  if (terms.length === 0) return 1;
  const haystack = fields(api);
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [field, text] of haystack) {
      const at = matchAt(text, term);
      if (at === -1) continue;
      best = Math.max(best, WEIGHT[field] + (at === 0 ? PREFIX_BONUS : 0));
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function searchApis(apis: ApiSummary[], query: string, locale: Locale): ApiSummary[] {
  const terms = tokenize(query);
  const collator = collatorFor(locale);
  return apis
    .map((api) => ({ api, score: scoreApi(api, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || collator.compare(a.api.name, b.api.name))
    .map((r) => r.api);
}
