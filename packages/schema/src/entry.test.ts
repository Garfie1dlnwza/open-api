import { describe, expect, it } from "vitest";
import { ApiEntrySchema } from "./entry.ts";
import { makeEntry } from "./fixtures.ts";
import { loadCatalog } from "./node.ts";

const base = makeEntry();
const parse = (patch: Record<string, unknown>) => ApiEntrySchema.safeParse({ ...base, ...patch });

describe("ApiEntrySchema", () => {
  it("requires both Thai and English text", () => {
    expect(parse({ name: { th: "ไทย" } }).success).toBe(false);
  });

  it.each(["http://api.example.go.th", "https://127.0.0.1/api", "https://localhost/api", "https://user:pw@api.example.go.th", "https://api.example.go.th/?a=1"])(
    "rejects unsafe base url %s",
    (baseUrl) => {
      expect(parse({ baseUrl }).success).toBe(false);
    },
  );

  it("allows plain http only when explicitly opted in", () => {
    expect(parse({ baseUrl: "http://api.example.go.th", allowInsecure: true }).success).toBe(true);
  });

  it("rejects path placeholders without a declared param and invalid examples", () => {
    const [endpoint] = base.endpoints;
    expect(parse({ endpoints: [{ ...endpoint, params: [] }] }).success).toBe(false);
    expect(parse({ endpoints: [{ ...endpoint, example: { currency: "USD", limit: "500" } }] }).success).toBe(false);
  });

  it("rejects duplicate endpoint ids", () => {
    expect(parse({ endpoints: [base.endpoints[0], base.endpoints[0]] }).success).toBe(false);
  });
});

describe("shipped catalog", () => {
  it("loads, and every API has at least one endpoint with a health check or is auth-gated", () => {
    const entries = loadCatalog();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      for (const endpoint of entry.endpoints) {
        const gated = entry.auth.type === "apiKey";
        expect(gated || endpoint.health.checks.length > 0, `${entry.id}/${endpoint.id} needs health checks`).toBe(true);
      }
    }
  });
});

describe("host and pattern hardening", () => {
  it.each(["127.0.0.1", "10.0.0.5", "[::1]", "db.internal", "printer.local", "nodot", "api.example.go.th:8443", "-bad.example.go.th"])(
    "rejects redirect host %s",
    (host) => {
      expect(parse({ redirectHosts: [host] }).success).toBe(false);
    },
  );

  it("normalises obfuscated IP base URLs before checking them", () => {
    for (const baseUrl of ["https://0x7f.1/api", "https://2130706433/api", "https://0177.0.0.1/api", "https://foo.internal/api"]) {
      expect(parse({ baseUrl }).success, baseUrl).toBe(false);
    }
  });

  it("accepts a public redirect host", () => {
    expect(parse({ redirectHosts: ["cdn.example.go.th"] }).success).toBe(true);
  });

  it("anchors patterns and refuses risky or invalid ones", () => {
    const [endpoint] = base.endpoints;
    const withPattern = (pattern: string, limit = "5") => ({
      endpoints: [{ ...endpoint, params: [...endpoint.params, { name: "code", in: "query", description: endpoint.title, pattern }], example: { ...endpoint.example, limit, code: "abc" } }],
    });
    expect(parse(withPattern("[a-c]{3}")).success).toBe(true);
    expect(parse(withPattern("b")).success).toBe(false); // example "abc" must match fully, not partially
    expect(parse(withPattern("(a+)+$")).success).toBe(false);
    expect(parse(withPattern("(")).success).toBe(false);
  });
});
