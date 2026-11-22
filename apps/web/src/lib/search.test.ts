import { describe, expect, it } from "vitest";
import { applyFilters, facetCounts, parseFilters, serializeFilters } from "./filters.ts";
import { scoreApi, searchApis } from "./search.ts";
import type { ApiSummary } from "./summary.ts";

const api = (over: Partial<ApiSummary>): ApiSummary => ({
  id: "x", name: "X", provider: "P", description: "D", category: "finance", categoryLabel: "การเงิน", source: "official", auth: "none",
  license: { type: "unknown", verified: false }, tags: [], status: "operational", reviewedAt: "2026-11-01", verifiedLabel: "", verifiedShort: "", aliases: [],
  trustScore: 50, trustLevel: "medium", endpoints: [], ...over,
});
const fx = api({ id: "bot-fx", name: "อัตราแลกเปลี่ยน", provider: "ธนาคารแห่งประเทศไทย", tags: ["fx"], auth: "apiKey", status: "auth_required", trustScore: 70, endpoints: [{ title: "รายวัน", path: "/DAILY_AVG" }] });
const air = api({ id: "air4thai", name: "Air4Thai คุณภาพอากาศ", provider: "กรมควบคุมมลพิษ", category: "environment", categoryLabel: "สิ่งแวดล้อม", tags: ["pm2.5"], status: "outage", reviewedAt: "2026-11-20" });
const oil = api({ id: "oil", name: "ราคาน้ำมัน", source: "unofficial", category: "energy", categoryLabel: "พลังงาน", trustScore: 10, reviewedAt: "2026-10-01" });
const all = [fx, air, oil];

describe("search", () => {
  it("matches Thai text by substring in name, provider, tags and endpoints", () => {
    expect(searchApis(all, "แลกเปลี่ยน", "th").map((a) => a.id)).toEqual(["bot-fx"]);
    expect(searchApis(all, "ธนาคาร", "th").map((a) => a.id)).toEqual(["bot-fx"]);
    expect(searchApis(all, "pm2.5", "th").map((a) => a.id)).toEqual(["air4thai"]);
    expect(searchApis(all, "daily_avg", "th").map((a) => a.id)).toEqual(["bot-fx"]);
  });
  it("requires every term to match and is case-insensitive", () => {
    expect(searchApis(all, "AIR4THAI อากาศ", "th")).toHaveLength(1);
    expect(searchApis(all, "air4thai น้ำมัน", "th")).toHaveLength(0);
  });
  it("does not match inside a Latin word, finds across punctuation and across languages", () => {
    const earth = api({ id: "quake", name: "Daily Earthquakes", description: "fairly large", aliases: ["แผ่นดินไหวรายวัน"] });
    expect(searchApis([earth], "air", "en")).toEqual([]);
    expect(searchApis([earth], "quake", "en")).toHaveLength(1);
    expect(searchApis([earth], "แผ่นดินไหว", "en")).toHaveLength(1);
    expect(searchApis([air], "pm25", "en").map((a) => a.id)).toEqual(["air4thai"]);
    expect(searchApis([air], "pm 2.5", "en").map((a) => a.id)).toEqual(["air4thai"]);
  });
  it("ranks name matches above description matches", () => {
    const byDesc = api({ id: "d", name: "Other", description: "about exchange" });
    const byName = api({ id: "n", name: "Exchange" });
    expect(searchApis([byDesc, byName], "exchange", "th")[0].id).toBe("n");
    expect(scoreApi(byDesc, ["nothing"])).toBe(0);
  });
});

describe("filters", () => {
  it("round-trips through the URL and ignores unknown values", () => {
    const params = serializeFilters({ q: "ฝุ่น", category: "environment", status: "outage", sort: "trust" });
    expect(parseFilters(params)).toMatchObject({ q: "ฝุ่น", category: "environment", status: "outage", sort: "trust" });
    expect(parseFilters(new URLSearchParams("category=bogus&status=x&sort=nope"))).toEqual({ q: "", category: undefined, source: undefined, auth: undefined, status: undefined, sort: undefined });
    expect(serializeFilters({ q: "" }).toString()).toBe("");
  });
  it("combines facets and sorts", () => {
    expect(applyFilters(all, { q: "", source: "official" }, "th").map((a) => a.id)).toEqual(["air4thai", "bot-fx"].sort((a, b) => new Intl.Collator("th").compare(all.find((x) => x.id === a)!.name, all.find((x) => x.id === b)!.name)));
    expect(applyFilters(all, { q: "", sort: "trust" }, "th")[0].id).toBe("bot-fx");
    expect(applyFilters(all, { q: "", sort: "verified" }, "th")[0].id).toBe("air4thai");
    expect(applyFilters(all, { q: "", auth: "apiKey", status: "outage" }, "th")).toEqual([]);
  });
  it("counts a facet ignoring itself but honouring the others", () => {
    expect(facetCounts(all, { q: "", source: "official" }, "category", "th")).toEqual({ finance: 1, environment: 1 });
    expect(facetCounts(all, { q: "", source: "official" }, "source", "th")).toEqual({ official: 2, unofficial: 1 });
  });
});
