import { describe, expect, it } from "vitest";
import { makeEntry } from "./fixtures.ts";
import { renderSample, sampleRequest } from "./samples.ts";

const api = makeEntry();
const keyed = makeEntry({ auth: { type: "apiKey", in: "header", name: "Authorization", signupUrl: "https://portal.example.go.th" } });

describe("samples", () => {
  it("renders the same URL the Worker would call", () => {
    const req = sampleRequest(api, api.endpoints[0])!;
    expect(req.url).toBe("https://api.example.go.th/v1/rates/USD?limit=5");
    expect(renderSample("curl", req)).toBe("curl \\\n  'https://api.example.go.th/v1/rates/USD?limit=5'");
    expect(renderSample("python", req)).toContain('requests.get("https://api.example.go.th/v1/rates/USD?limit=5"');
    expect(renderSample("javascript", req)).toContain("await fetch(");
  });

  it("uses a placeholder, never a real key, for auth", () => {
    const req = sampleRequest(keyed, keyed.endpoints[0])!;
    expect(renderSample("curl", req)).toContain("-H 'Authorization: YOUR_API_KEY'");
    expect(renderSample("javascript", req)).toContain("YOUR_API_KEY");
  });

  it("returns null when values are invalid", () => {
    expect(sampleRequest(api, api.endpoints[0], { currency: "../x" })).toBeNull();
  });
});
