export type ChartKeyAction = { kind: "move"; index: number } | { kind: "close" } | null;

/**
 * What a key press does on a chart with `count` points, given the point that is active now (null =
 * none yet). Arrows step, Home/End jump, Escape closes the readout. Anything else is left alone, so
 * Tab still moves on and the browser keeps its shortcuts.
 */
export function chartKeyAction(key: string, active: number | null, count: number): ChartKeyAction {
  if (count <= 0) return null;
  const last = count - 1;
  switch (key) {
    case "ArrowRight":
      return { kind: "move", index: Math.min((active ?? -1) + 1, last) };
    case "ArrowLeft":
      return { kind: "move", index: Math.max((active ?? count) - 1, 0) };
    case "Home":
      return { kind: "move", index: 0 };
    case "End":
      return { kind: "move", index: last };
    case "Escape":
      return { kind: "close" };
    default:
      return null;
  }
}
