import { useInView } from "./useChart.ts";

const W = 96;
const H = 28;
const PAD = 4;

/** Twelve-ish points of context beside a number. Decorative: the number and the chart carry the facts. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  if (values.length < 2) return null;
  const [lo, hi] = [Math.min(...values), Math.max(...values)];
  const coords = values.map((v, i) => [PAD + (i / (values.length - 1)) * (W - PAD * 2), H - PAD - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (H - PAD * 2)] as const);
  const [lx, ly] = coords[coords.length - 1];
  return (
    <span ref={ref} data-in={inView ? "true" : "false"} aria-hidden className="inline-block">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="chart-line" />
        <circle cx={lx} cy={ly} r="3" fill={color} stroke="var(--surface)" strokeWidth="2" className="chart-fade" />
      </svg>
    </span>
  );
}
