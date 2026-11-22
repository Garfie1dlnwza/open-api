export const ROUTES = { playground: "/v1/playground", health: "/healthz" } as const;
/** Anchored: only JSON, XML (including +json/+xml types) and text/* are shown. */
export const ALLOWED_CONTENT_TYPE = /^(?:application\/(?:[\w.+-]+\+)?(?:json|xml)|text\/[\w.+-]+)\s*(?:;.*)?$/i;
export const UPSTREAM_ACCEPT = "application/json, application/xml;q=0.9, text/plain;q=0.8, */*;q=0.1";
export const PLAYGROUND_CONTENT_TYPE = "application/json";
export const RATE_LIMIT_FALLBACK_KEY = "anonymous";
export const CLIENT_IP_HEADER = "cf-connecting-ip";
export const SECURITY_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;
