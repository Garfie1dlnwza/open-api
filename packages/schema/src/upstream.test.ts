import { describe, expect, it, vi } from "vitest";
import { makeEntry } from "./fixtures.ts";
import { fetchWithRedirects, policyFromEntry } from "./upstream.ts";

const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });
const entry = makeEntry({ redirectHosts: ["cdn.example.go.th"] });
const start = new URL("https://api.example.go.th/v1/x");
const run = (impl: ReturnType<typeof vi.fn>, policy = policyFromEntry(entry)) =>
  fetchWithRedirects(policy, start, {}, impl as unknown as typeof fetch, "application/json");

describe("fetchWithRedirects", () => {
  it("returns non-redirect responses untouched", async () => {
    const res = await run(vi.fn(async () => new Response("ok")));
    expect(await res?.text()).toBe("ok");
  });

  it.each(["http://169.254.169.254/latest/meta-data", "https://evil.test/", "http://api.example.go.th/", "https://u:p@api.example.go.th/"])(
    "refuses a redirect to %s",
    async (location) => {
      expect(await run(vi.fn(async () => redirect(location)))).toBeNull();
    },
  );

  it("follows a redirect to a declared host and stops after the hop limit", async () => {
    const calls: string[] = [];
    const impl = vi.fn(async (u: URL) => {
      calls.push(String(u));
      return calls.length === 1 ? redirect("https://cdn.example.go.th/y") : new Response("done");
    });
    expect(await (await run(impl))?.text()).toBe("done");
    expect(calls).toEqual(["https://api.example.go.th/v1/x", "https://cdn.example.go.th/y"]);
    expect(await run(vi.fn(async () => redirect("https://api.example.go.th/loop")))).toBeNull();
  });

  it("keeps keyed APIs on their own host", async () => {
    const keyed = makeEntry({
      auth: { type: "apiKey", in: "header", name: "Authorization", signupUrl: "https://portal.example.go.th" },
      redirectHosts: ["cdn.example.go.th"],
    });
    expect(await run(vi.fn(async () => redirect("https://cdn.example.go.th/y")), policyFromEntry(keyed))).toBeNull();
  });
});
