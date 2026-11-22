import { describe, expect, it } from "vitest";
import { sharePercents } from "./shares.ts";

describe("sharePercents", () => {
  it("adds up to exactly 100 where plain rounding would not", () => {
    expect(sharePercents([1, 1, 1])).toEqual([34, 33, 33]);
    expect(sharePercents([3, 3, 2])).toEqual([38, 37, 25]);
    for (const parts of [[1, 1, 1], [5, 2, 1], [7, 7, 7, 7, 7, 7, 1], [1, 2, 4, 8]]) {
      expect(sharePercents(parts).reduce((n, v) => n + v, 0)).toBe(100);
    }
  });
  it("keeps zero parts at zero and handles an empty total", () => {
    expect(sharePercents([4, 0, 4])).toEqual([50, 0, 50]);
    expect(sharePercents([0, 0])).toEqual([0, 0]);
    expect(sharePercents([])).toEqual([]);
  });
});
