import {
  AUTH_TYPES,
  CATEGORIES,
  HEALTH_REASONS,
  LICENSE_TYPES,
  PLAYGROUND_ERROR_CODES,
  SOURCES,
  STATUSES,
  TRUST_FACTORS,
} from "@thai-open-api/schema";
import { describe, expect, it } from "vitest";
import { SORTS } from "../config/site.ts";
import { createT, flattenKeys, getMessages } from "./index.ts";

const th = flattenKeys(getMessages("th"));
const en = flattenKeys(getMessages("en"));

describe("messages", () => {
  it("has exactly the same keys in Thai and English", () => {
    expect(en.sort()).toEqual(th.sort());
  });

  it("has no empty strings", () => {
    for (const locale of ["th", "en"] as const) {
      const t = createT(locale);
      for (const key of th) expect(t(key as never).trim(), `${locale}:${key}`).not.toBe("");
    }
  });

  it("covers every enum value used by the catalog and the Worker", () => {
    const expected = [
      ...STATUSES.map((s) => `status.${s}`),
      ...HEALTH_REASONS.map((s) => `statusReason.${s}`),
      ...SOURCES.flatMap((s) => [`source.${s}`, `sourceHint.${s}`]),
      ...CATEGORIES.map((s) => `category.${s}`),
      ...AUTH_TYPES.map((s) => `auth.${s}`),
      ...LICENSE_TYPES.map((s) => `license.${s}`),
      ...PLAYGROUND_ERROR_CODES.map((s) => `playground.errors.${s}`),
      ...TRUST_FACTORS.map((s) => `trust.factors.${s}`),
      ...SORTS.map((s) => `explorer.sortOptions.${s}`),
    ];
    expect(expected.filter((key) => !th.includes(key))).toEqual([]);
  });

  it("interpolates variables and leaves unknown placeholders visible", () => {
    const t = createT("en");
    expect(t("explorer.results", { count: 3 })).toBe("3 APIs found");
    expect(t("explorer.results")).toContain("{count}");
  });
});
