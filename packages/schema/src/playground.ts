import { z } from "zod";
import type { ApiEntry, Auth, Endpoint, Param } from "./entry.ts";
import { LIMITS, PLAYGROUND_ERROR_CODES, type PlaygroundErrorCode } from "./constants.ts";
import { buildRequest } from "./url.ts";

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Visible ASCII only: blocks CR/LF header injection and exotic encodings in keys.
const AUTH_VALUE = /^[\x21-\x7e]+$/;

/** What the browser may send. Note: no URL, no method, no headers. Only catalog IDs. */
export const PlaygroundRequestSchema = z.strictObject({
  apiId: z.string().regex(idPattern).max(64),
  endpointId: z.string().regex(idPattern).max(64),
  params: z
    .record(z.string().max(64), z.string().max(LIMITS.maxParamValueLength))
    .refine((p) => Object.keys(p).length <= LIMITS.maxParams, "too many params")
    .default({}),
  authValue: z.string().max(LIMITS.maxAuthValueLength).optional(),
});
export type PlaygroundRequest = z.infer<typeof PlaygroundRequestSchema>;

export const PlaygroundResponseSchema = z.discriminatedUnion("ok", [
  z.strictObject({
    ok: z.literal(true),
    upstream: z.strictObject({
      status: z.number().int(),
      statusText: z.string(),
      contentType: z.string(),
      durationMs: z.number(),
      sizeBytes: z.number(),
      truncated: z.boolean(),
      body: z.string(),
    }),
  }),
  z.strictObject({
    ok: z.literal(false),
    error: z.strictObject({ code: z.enum(PLAYGROUND_ERROR_CODES), message: z.string(), param: z.string().optional() }),
  }),
]);
export type PlaygroundResponse = z.infer<typeof PlaygroundResponseSchema>;

/** The slice of the catalog the Worker is allowed to know about. Generated at build time. */
export interface WorkerEndpoint {
  id: string;
  path: string;
  params: Param[];
}
export interface WorkerApi {
  id: string;
  baseUrl: string;
  auth: Auth;
  /** Hosts redirects may land on: the base host plus declared redirectHosts. */
  allowedHosts: string[];
  maxResponseBytes: number;
  endpoints: WorkerEndpoint[];
}
export type WorkerCatalog = Record<string, WorkerApi>;

export function toWorkerCatalog(entries: ApiEntry[]): WorkerCatalog {
  const catalog: WorkerCatalog = {};
  for (const api of entries) {
    const endpoints = api.endpoints.filter((e: Endpoint) => e.playground);
    if (endpoints.length === 0) continue;
    catalog[api.id] = {
      id: api.id,
      baseUrl: api.baseUrl,
      auth: api.auth,
      allowedHosts: [new URL(api.baseUrl).host, ...api.redirectHosts],
      maxResponseBytes: api.maxResponseBytes,
      endpoints: endpoints.map(({ id, path, params }) => ({ id, path, params })),
    };
  }
  return catalog;
}

export type ValidatedPlayground =
  | { ok: true; api: WorkerApi; url: URL; headers: Record<string, string> }
  | { ok: false; code: PlaygroundErrorCode; message: string; param?: string };

const fail = (code: PlaygroundErrorCode, message: string, param?: string): ValidatedPlayground => ({ ok: false, code, message, param });

export function validatePlaygroundRequest(catalog: WorkerCatalog, body: unknown): ValidatedPlayground {
  const parsed = PlaygroundRequestSchema.safeParse(body);
  if (!parsed.success) return fail("invalid_request", "Request body does not match the playground schema");
  const { apiId, endpointId, params, authValue } = parsed.data;

  // Own-property lookups only: "__proto__" or "constructor" must not resolve to anything.
  const api = Object.hasOwn(catalog, apiId) ? catalog[apiId] : undefined;
  if (!api) return fail("unknown_api", "Unknown API");
  const endpoint = api.endpoints.find((e) => e.id === endpointId);
  if (!endpoint) return fail("unknown_endpoint", "Unknown endpoint");

  if (api.auth.type === "apiKey") {
    if (!authValue) return fail("missing_auth", "This API needs an API key");
    if (!AUTH_VALUE.test(authValue)) return fail("invalid_auth", "API key contains unsupported characters");
  }

  const built = buildRequest(api, endpoint, params, authValue);
  if (!built.ok) return fail("invalid_param", built.message, built.name);
  return { ok: true, api, url: built.url, headers: built.headers };
}

export const redirectAllowed = (api: WorkerApi, from: URL, to: URL): boolean =>
  to.protocol === from.protocol && api.allowedHosts.includes(to.host) && !to.username && !to.password;
