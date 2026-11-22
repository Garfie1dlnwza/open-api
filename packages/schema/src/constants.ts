/** Single source of truth for every enum and limit shared by catalog, worker and web. */

export const CATEGORIES = ["government", "finance", "environment", "geography", "energy"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Where an API comes from: official = published by the agency itself. */
export const SOURCES = ["official", "community", "unofficial"] as const;
export type Source = (typeof SOURCES)[number];

export const STATUSES = ["operational", "degraded", "outage", "unknown", "auth_required"] as const;
export type Status = (typeof STATUSES)[number];

export const AUTH_TYPES = ["none", "apiKey"] as const;
export const AUTH_LOCATIONS = ["header", "query"] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export const LICENSE_TYPES = ["open", "terms", "varies", "unknown"] as const;
export type LicenseType = (typeof LICENSE_TYPES)[number];

export const PARAM_TYPES = ["string", "integer", "number", "boolean", "date"] as const;
export type ParamType = (typeof PARAM_TYPES)[number];
export const PARAM_LOCATIONS = ["query", "path"] as const;

export const RESPONSE_FORMATS = ["json", "xml", "text"] as const;
export type ResponseFormat = (typeof RESPONSE_FORMATS)[number];

export const JSON_VALUE_TYPES = ["string", "number", "boolean", "array", "object"] as const;

export const HEALTH_REASONS = [
  "ok",
  "timeout",
  "network",
  "tls",
  "redirect_blocked",
  "auth_required",
  "unexpected_auth",
  "rate_limited",
  "http_error",
  "not_json",
  "schema_mismatch",
  "optional_check_failed",
  "slow",
] as const;
export type HealthReason = (typeof HEALTH_REASONS)[number];

export const PLAYGROUND_ERROR_CODES = [
  "invalid_request",
  "origin_not_allowed",
  "unknown_api",
  "unknown_endpoint",
  "invalid_param",
  "missing_auth",
  "invalid_auth",
  "rate_limited",
  "upstream_timeout",
  "upstream_unreachable",
  "redirect_blocked",
  "unsupported_media",
  "not_found",
  "method_not_allowed",
] as const;
export type PlaygroundErrorCode = (typeof PLAYGROUND_ERROR_CODES)[number];

export const HTTP = {
  ok: 200,
  unauthorized: 401,
  forbidden: 403,
  tooManyRequests: 429,
  serverError: 500,
} as const;

export const LIMITS = {
  /** Playground / health upstream request timeout. */
  upstreamTimeoutMs: 10_000,
  maxRedirects: 3,
  defaultMaxResponseBytes: 1_000_000,
  hardMaxResponseBytes: 2_000_000,
  maxRequestBodyBytes: 8_192,
  maxParams: 20,
  maxParamValueLength: 512,
  maxAuthValueLength: 2_048,
} as const;

export const HEALTH = {
  slowMs: 3_000,
  /** Status older than this is shown as unknown rather than trusted. */
  staleHours: 72,
  historyLength: 30,
  /** Samples needed before stability counts towards trust. */
  minHistoryForStability: 7,
} as const;

export const TRUST = {
  max: { source: 30, docs: 15, license: 15, freshness: 15, stability: 15, example: 10 },
  sourcePoints: { official: 30, community: 12, unofficial: 0 },
  licensePartial: 6,
  freshDays: 90,
  staleDays: 180,
  freshnessPartial: 8,
  levels: { high: 75, medium: 50 },
} as const;

export const AUTH_PLACEHOLDER = "YOUR_API_KEY";
export const USER_AGENT = "ThaiOpenAPI-Playground/0.1";
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;
