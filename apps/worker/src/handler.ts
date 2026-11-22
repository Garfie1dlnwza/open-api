import {
  LIMITS,
  fetchWithRedirects,
  validatePlaygroundRequest,
  type PlaygroundErrorCode,
  type PlaygroundResponse,
  type WorkerCatalog,
} from "@thai-open-api/schema";
import {
  ALLOWED_CONTENT_TYPE,
  CLIENT_IP_HEADER,
  PLAYGROUND_CONTENT_TYPE,
  RATE_LIMIT_FALLBACK_KEY,
  ROUTES,
  SECURITY_HEADERS,
  UPSTREAM_ACCEPT,
} from "./config.ts";
import { ERROR_STATUS } from "./errors.ts";
import { readLimited } from "./read-limited.ts";

export interface Env {
  ALLOWED_ORIGINS?: string;
  RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}
export interface Deps {
  catalog: WorkerCatalog;
  fetch: typeof fetch;
}

const parseOrigins = (value: string | undefined) =>
  (value ?? "").split(",").map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

function respond(body: PlaygroundResponse | { ok: true }, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": PLAYGROUND_CONTENT_TYPE, ...SECURITY_HEADERS, ...cors },
  });
}

const failure = (code: PlaygroundErrorCode, message: string, cors: Record<string, string>, param?: string) =>
  respond({ ok: false, error: { code, message, param } }, ERROR_STATUS[code], cors);

export async function handle(request: Request, env: Env, deps: Deps): Promise<Response> {
  const { pathname } = new URL(request.url);
  const origin = request.headers.get("origin");
  const allowed = parseOrigins(env.ALLOWED_ORIGINS);

  if (pathname === ROUTES.health) return respond({ ok: true }, 200, {});
  if (pathname !== ROUTES.playground) return failure("not_found", "Not found", {});

  // The playground is for this site's pages only. Origin is client-set, so this is not a security
  // boundary against scripts; the catalog-ID-only API, per-IP rate limit and size caps are.
  if (!origin || !allowed.includes(origin)) return failure("origin_not_allowed", "Origin is not allowed", {});
  const cors = corsHeaders(origin, allowed);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return failure("method_not_allowed", "Use POST", cors);

  if (env.RATE_LIMITER) {
    const key = request.headers.get(CLIENT_IP_HEADER) ?? RATE_LIMIT_FALLBACK_KEY;
    if (!(await env.RATE_LIMITER.limit({ key })).success) return failure("rate_limited", "Too many requests", cors);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > LIMITS.maxRequestBodyBytes) return failure("invalid_request", "Request body is too large", cors);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return failure("invalid_request", "Request body is not valid JSON", cors);
  }

  const checked = validatePlaygroundRequest(deps.catalog, body);
  if (!checked.ok) return failure(checked.code, checked.message, cors, checked.param);

  const started = performance.now();
  let upstream: Response | null;
  try {
    upstream = await fetchWithRedirects(checked.api, checked.url, checked.headers, deps.fetch, UPSTREAM_ACCEPT);
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
    return timedOut ? failure("upstream_timeout", "The API did not answer in time", cors) : failure("upstream_unreachable", "Could not reach the API", cors);
  }
  if (!upstream) return failure("redirect_blocked", "The API redirected somewhere that is not allowed", cors);

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!ALLOWED_CONTENT_TYPE.test(contentType)) {
    await upstream.body?.cancel();
    return failure("unsupported_media", "The API returned a content type the playground cannot show", cors);
  }

  const { text, sizeBytes, truncated } = await readLimited(upstream, checked.api.maxResponseBytes);
  return respond(
    {
      ok: true,
      upstream: {
        status: upstream.status,
        statusText: upstream.statusText,
        contentType,
        durationMs: Math.round(performance.now() - started),
        sizeBytes,
        truncated,
        body: text,
      },
    },
    200,
    cors,
  );
}
