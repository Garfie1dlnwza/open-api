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
  contribute: (l: Locale) => `${SITE.repoUrl}/blob/main/CONTRIBUTING.md`,
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

export const UI = {
  searchDebounceMs: 200,
  searchResultLimit: 8,
  homeListSize: 6,
  copiedResetMs: 1_600,
  responsePreviewChars: 200_000,
} as const;

export const SORTS = ["relevance", "name", "trust", "verified"] as const;
export type Sort = (typeof SORTS)[number];
export const DEFAULT_SORT: Sort = "name";

export const HOTKEY = "k";
