import { describe, expect, it } from "vitest";
import { makeEntry } from "./fixtures.ts";
import { toWorkerCatalog, validatePlaygroundRequest } from "./playground.ts";
import { redirectAllowed } from "./upstream.ts";

const keyed = makeEntry({
  id: "keyed",
  auth: { type: "apiKey", in: "header", name: "Authorization", signupUrl: "https://portal.example.go.th" },
});
const catalog = toWorkerCatalog([makeEntry(), keyed]);
const ok = { apiId: "demo", endpointId: "rates", params: { currency: "USD", limit: "5" } };

describe("validatePlaygroundRequest", () => {
  it("builds the upstream URL from catalog data only", () => {
    const result = validatePlaygroundRequest(catalog, ok);
    expect(result.ok && result.url.toString()).toBe("https://api.example.go.th/v1/rates/USD?limit=5");
  });

  it.each([
    ["a raw url field", { ...ok, url: "http://169.254.169.254/latest" }],
    ["a method field", { ...ok, method: "POST" }],
    ["a headers field", { ...ok, headers: { Host: "evil.test" } }],
    ["a non-object body", "https://evil.test"],
  ])("rejects %s", (_, body) => {
    const result = validatePlaygroundRequest(catalog, body);
    expect(result).toMatchObject({ ok: false, code: "invalid_request" });
  });

  it("rejects unknown API and endpoint ids, including prototype keys", () => {
    expect(validatePlaygroundRequest(catalog, { ...ok, apiId: "nope" })).toMatchObject({ code: "unknown_api" });
    expect(validatePlaygroundRequest(catalog, { ...ok, apiId: "constructor" })).toMatchObject({ code: "unknown_api" });
    expect(validatePlaygroundRequest(catalog, { ...ok, endpointId: "nope" })).toMatchObject({ code: "unknown_endpoint" });
  });

  it.each(["..", ".", "a/b", "a\\b", "%2e%2e", "US D", "a\r\nb"])("rejects path value %j", (currency) => {
    const result = validatePlaygroundRequest(catalog, { ...ok, params: { currency } });
    expect(result).toMatchObject({ ok: false, code: "invalid_param" });
  });

  it("rejects undeclared params, out-of-range and mistyped values", () => {
    for (const params of [{ ...ok.params, extra: "1" }, { ...ok.params, limit: "999" }, { ...ok.params, limit: "abc" }]) {
      expect(validatePlaygroundRequest(catalog, { ...ok, params })).toMatchObject({ code: "invalid_param" });
    }
    expect(validatePlaygroundRequest(catalog, { ...ok, params: {} })).toMatchObject({ code: "invalid_param", param: "currency" });
  });

  it("encodes query values so they cannot add parameters", () => {
    const result = validatePlaygroundRequest(catalog, { ...ok, params: { currency: "USD", limit: "5&admin=1" } });
    expect(result).toMatchObject({ ok: false, code: "invalid_param" });
  });

  it("requires a well-formed key for keyed APIs and keeps it out of the URL for header auth", () => {
    const keyedBody = { ...ok, apiId: "keyed" };
    expect(validatePlaygroundRequest(catalog, keyedBody)).toMatchObject({ code: "missing_auth" });
    expect(validatePlaygroundRequest(catalog, { ...keyedBody, authValue: "tok\r\nX: y" })).toMatchObject({ code: "invalid_auth" });
    const good = validatePlaygroundRequest(catalog, { ...keyedBody, authValue: "secret" });
    expect(good.ok && good.headers).toEqual({ Authorization: "secret" });
    expect(good.ok && good.url.toString()).not.toContain("secret");
  });
});

describe("redirectAllowed", () => {
  const api = catalog.demo;
  const from = new URL("https://api.example.go.th/v1/rates/USD");
  it("only follows redirects to allowed hosts on the same protocol", () => {
    expect(redirectAllowed(api, from, new URL("https://api.example.go.th/other"))).toBe(true);
    expect(redirectAllowed(api, from, new URL("https://evil.test/"))).toBe(false);
    expect(redirectAllowed(api, from, new URL("http://api.example.go.th/"))).toBe(false);
    expect(redirectAllowed(api, from, new URL("https://u:p@api.example.go.th/"))).toBe(false);
  });
});
