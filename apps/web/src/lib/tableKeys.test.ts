import { describe, expect, it } from "vitest";
import { rowKeys } from "./tableKeys.ts";

describe("rowKeys", () => {
  it("gives identical rows different keys, and keeps the first one plain", () => {
    const keys = rowKeys([["10:00", "100%"], ["10:00", "100%"], ["10:01", "50%"], ["10:00", "100%"]]);
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe("10:00|100%");
  });
});
