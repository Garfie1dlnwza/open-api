import type { Locale } from "@thai-open-api/schema";

/** App-wide constants. Everything environment-dependent is read here and nowhere else. */
export const SITE = {
  name: "Thai Open API",
  url: import.meta.env.PUBLIC_SITE_URL ?? "http://localhost:4321",
  repoUrl: import.meta.env.PUBLIC_REPO_URL ?? "https://github.com/Garfie1dlnwza/open-api",
  playgroundUrl: import.meta.env.PUBLIC_PLAYGROUND_URL ?? "",
} as const;

export const ROUTES = {
  home: (l: Locale) => `/${l}/`,
  explore: (l: Locale) => `/${l}/apis/`,
  api: (l: Locale, id: string) => `/${l}/apis/${id}/`,
  searchIndex: (l: Locale) => `/${l}/search-index.json`,
  contribute: () => `${SITE.repoUrl}/blob/main/CONTRIBUTING.md`,
  root: "/",
} as const;

/** Query-string keys of the explorer; the URL is the single source of filter state. */
export const QUERY = {
  search: "q",
  category: "category",
  source: "source",
  auth: "auth",
  status: "status",
  sort: "sort",
} as const;

export const STORAGE = {
  playgroundKey: "toa:playground-key",
  playgroundConsent: "toa:playground-consent",
  playgroundRemember: "toa:playground-remember",
} as const;

/** Per-API storage key so a key saved for one provider is never offered to another. */
export const storageKey = (base: string, apiId: string) => `${base}:${apiId}`;

export const UI = {
  searchDebounceMs: 200,
  searchResultLimit: 8,
  homeListSize: 6,
  copiedResetMs: 1_600,
  responsePreviewChars: 200_000,
  playgroundClientTimeoutMs: 20_000,
} as const;

export const SORTS = ["relevance", "name", "trust", "verified"] as const;
export type Sort = (typeof SORTS)[number];
export const DEFAULT_SORT: Sort = "name";

export const HOTKEY = "k";

/** Each language is always shown in its own script, whatever the page language is. */
export const LOCALE_NAMES: Record<Locale, string> = { th: "ไทย", en: "English" };
