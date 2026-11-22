import { describe, expect, it } from "vitest";
import { moveActive, typeAhead } from "./listbox.ts";

describe("moveActive", () => {
  it("moves within bounds and jumps to the ends", () => {
    expect(moveActive("ArrowDown", 0, 3)).toBe(1);
    expect(moveActive("ArrowDown", 2, 3)).toBe(2);
    expect(moveActive("ArrowUp", 0, 3)).toBe(0);
    expect(moveActive("ArrowUp", 2, 3)).toBe(1);
    expect(moveActive("Home", 2, 3)).toBe(0);
    expect(moveActive("End", 0, 3)).toBe(2);
    expect(moveActive("PageDown", 1, 30)).toBe(11);
  });
  it("ignores other keys and empty lists", () => {
    expect(moveActive("a", 0, 3)).toBeNull();
    expect(moveActive("ArrowDown", 0, 0)).toBeNull();
  });
});

describe("typeAhead", () => {
  const labels = ["Name", "Trust", "Tidy", "Reviewed"];
  it("finds the next label that starts with what was typed", () => {
    expect(typeAhead(labels, "r", 0)).toBe(3);
    expect(typeAhead(labels, "tr", 0)).toBe(1);
    expect(typeAhead(labels, "zz", 0)).toBe(-1);
    expect(typeAhead(labels, "", 0)).toBe(-1);
  });
  it("cycles when the same letter is repeated, and matches Thai", () => {
    expect(typeAhead(labels, "t", 1)).toBe(2);
    expect(typeAhead(labels, "t", 2)).toBe(1);
    expect(typeAhead(["ชื่อ", "ความน่าเชื่อถือ", "ทบทวน"], "คว", 0)).toBe(1);
  });
});
