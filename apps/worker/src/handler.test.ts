import { makeEntry } from "@thai-open-api/schema/fixtures";
import { toWorkerCatalog } from "@thai-open-api/schema";
import { describe, expect, it, vi } from "vitest";
import { handle, type Env } from "./handler.ts";

const keyed = makeEntry({
  id: "keyed",
  auth: { type: "apiKey", in: "header", name: "Authorization", signupUrl: "https://portal.example.go.th" },
  redirectHosts: ["cdn.example.go.th"],
});
const open = makeEntry({ redirectHosts: ["cdn.example.go.th"] });
const catalog = toWorkerCatalog([open, keyed]);
const ORIGIN = "https://open-api.example.org";
const env: Env = { ALLOWED_ORIGINS: ORIGIN };

const call = (body: unknown, init: { origin?: string | null; method?: string; fetchImpl?: typeof fetch; env?: Env } = {}) => {
  const fetchImpl = init.fetchImpl ?? vi.fn(async () => json({ data: [1] }));
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  const request = new Request("https://worker.test/v1/playground", {
    method: init.method ?? "POST",
    headers,
    body: init.method === "GET" || init.method === "OPTIONS" ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  return handle(request, init.env ?? env, { catalog, fetch: fetchImpl }).then(async (res) => ({ res, json: res.status === 204 ? null : await res.json(), fetchImpl }));
};
const json = (value: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" }, ...init });
const ok = { apiId: "demo", endpointId: "rates", params: { currency: "USD" } };

describe("playground worker", () => {
  it("proxies a catalog request and reports status, size and timing", async () => {
    const { res, json: body, fetchImpl } = await call(ok);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, upstream: { status: 200, truncated: false, body: '{"data":[1]}' } });
    expect(String((fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][0])).toBe("https://api.example.go.th/v1/rates/USD");
    expect((fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({ method: "GET", redirect: "manual" });
  });

  it("never calls upstream for requests that carry their own URL or fail validation", async () => {
    for (const body of [{ ...ok, url: "http://169.254.169.254/" }, { ...ok, apiId: "nope" }, { ...ok, params: { currency: ".." } }, "not json"]) {
      const { res, fetchImpl } = await call(body);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("rejects unknown origins and answers preflight only for allowed ones", async () => {
    const denied = await call(ok, { origin: "https://evil.test" });
    expect(denied.res.status).toBe(403);
    expect(denied.res.headers.get("access-control-allow-origin")).toBeNull();

    const preflight = await call(null, { method: "OPTIONS" });
    expect(preflight.res.status).toBe(204);
    expect(preflight.res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("fails closed when no origins are configured or the Origin header is missing", async () => {
    expect((await call(ok, { env: {} })).res.status).toBe(403);
    const noOrigin = await call(ok, { origin: null });
    expect(noOrigin.res.status).toBe(403);
    expect(noOrigin.fetchImpl).not.toHaveBeenCalled();
  });

  it("only accepts POST and rejects oversized bodies", async () => {
    expect((await call(null, { method: "GET" })).res.status).toBe(405);
    const big = await call({ ...ok, authValue: "x".repeat(20_000) });
    expect(big.json).toMatchObject({ ok: false, error: { code: "invalid_request" } });
  });

  it("blocks redirects to hosts outside the catalog and follows allowed ones", async () => {
    const evil = vi.fn(async () => new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }));
    expect((await call(ok, { fetchImpl: evil as unknown as typeof fetch })).json).toMatchObject({ error: { code: "redirect_blocked" } });

    const calls: string[] = [];
    const hop = vi.fn(async (input: URL | string) => {
      calls.push(String(input));
      return calls.length === 1 ? new Response(null, { status: 301, headers: { location: "https://cdn.example.go.th/rates" } }) : json({ data: [1] });
    });
    const followed = await call(ok, { fetchImpl: hop as unknown as typeof fetch });
    expect(followed.json).toMatchObject({ ok: true });
    expect(calls).toEqual(["https://api.example.go.th/v1/rates/USD", "https://cdn.example.go.th/rates"]);
  });

  it("never forwards an API key to a different host, even an allowed one", async () => {
    const hop = vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://cdn.example.go.th/x" } }));
    const result = await call({ ...ok, apiId: "keyed", authValue: "secret" }, { fetchImpl: hop as unknown as typeof fetch });
    expect(result.json).toMatchObject({ error: { code: "redirect_blocked" } });
    expect(hop).toHaveBeenCalledTimes(1);
  });

  it("gives up after too many redirects", async () => {
    const loop = vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://api.example.go.th/again" } }));
    expect((await call(ok, { fetchImpl: loop as unknown as typeof fetch })).json).toMatchObject({ error: { code: "redirect_blocked" } });
    expect(loop.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it("truncates huge responses and refuses binary content", async () => {
    const huge = vi.fn(async () => new Response("a".repeat(1_500_000), { headers: { "content-type": "text/plain" } }));
    const truncated = await call(ok, { fetchImpl: huge as unknown as typeof fetch });
    expect(truncated.json).toMatchObject({ ok: true, upstream: { truncated: true, sizeBytes: 1_000_000 } });

    const binary = vi.fn(async () => new Response("x", { headers: { "content-type": "application/octet-stream" } }));
    expect((await call(ok, { fetchImpl: binary as unknown as typeof fetch })).json).toMatchObject({ error: { code: "unsupported_media" } });
  });

  it("maps timeouts and network errors without leaking details", async () => {
    const timeout = vi.fn(async () => { throw new DOMException("timed out", "TimeoutError"); });
    expect((await call(ok, { fetchImpl: timeout as unknown as typeof fetch })).res.status).toBe(504);
    const boom = vi.fn(async () => { throw new TypeError("connect ECONNREFUSED 10.0.0.1:443"); });
    const failed = await call(ok, { fetchImpl: boom as unknown as typeof fetch });
    expect(failed.res.status).toBe(502);
    expect(JSON.stringify(failed.json)).not.toContain("10.0.0.1");
  });

  it("applies the rate limiter and keeps the key out of responses", async () => {
    const limited = await call(ok, { env: { ...env, RATE_LIMITER: { limit: async () => ({ success: false }) } } });
    expect(limited.res.status).toBe(429);

    const echo = await call({ ...ok, apiId: "keyed", authValue: "super-secret-token" });
    expect(JSON.stringify(echo.json)).not.toContain("super-secret-token");
    expect(((echo.fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "super-secret-token" });
  });

  it("serves a health route and 404s everything else", async () => {
    const health = await handle(new Request("https://worker.test/healthz"), env, { catalog, fetch });
    expect(health.status).toBe(200);
    const other = await handle(new Request("https://worker.test/anything"), env, { catalog, fetch });
    expect(other.status).toBe(404);
  });
});
