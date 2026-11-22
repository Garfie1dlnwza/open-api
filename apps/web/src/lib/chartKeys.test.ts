import { describe, expect, it } from "vitest";
import { chartKeyAction } from "./chartKeys.ts";

describe("chartKeyAction", () => {
  it("starts at the ends when nothing is active, then steps and clamps", () => {
    expect(chartKeyAction("ArrowRight", null, 5)).toEqual({ kind: "move", index: 0 });
    expect(chartKeyAction("ArrowLeft", null, 5)).toEqual({ kind: "move", index: 4 });
    expect(chartKeyAction("ArrowRight", 4, 5)).toEqual({ kind: "move", index: 4 });
    expect(chartKeyAction("ArrowLeft", 0, 5)).toEqual({ kind: "move", index: 0 });
    expect(chartKeyAction("ArrowRight", 1, 5)).toEqual({ kind: "move", index: 2 });
  });
  it("jumps with Home and End and closes with Escape", () => {
    expect(chartKeyAction("Home", 3, 5)).toEqual({ kind: "move", index: 0 });
    expect(chartKeyAction("End", 1, 5)).toEqual({ kind: "move", index: 4 });
    expect(chartKeyAction("Escape", 2, 5)).toEqual({ kind: "close" });
  });
  it("ignores other keys and empty charts", () => {
    expect(chartKeyAction("Tab", 1, 5)).toBeNull();
    expect(chartKeyAction("a", null, 5)).toBeNull();
    expect(chartKeyAction("ArrowRight", null, 0)).toBeNull();
  });
});
