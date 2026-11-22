import type { Locale } from "@thai-open-api/schema";
import { useMemo, useRef, useState } from "react";
import type { TrendPoint } from "../../lib/dashboard.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { niceScale, useInView, useWidth } from "./useChart.ts";

const HEIGHT = 224;
const MARGIN = { top: 12, right: 16, bottom: 28, left: 44 };
const X_TICKS = 4;
const TWO_DAYS_MS = 172_800_000;
const TEN_MINUTES_MS = 600_000;
const ONE_HOUR_MS = 3_600_000;
const DOT = 4; // marker radius: 8px diameter

/** Time on x (to scale, so gaps look like gaps), one measure on y, starting at zero. 2px line, hairline grid. */
export function LineChart({ points, locale, color, formatTick, formatValue, valueLabel, ariaLabel, fixedMax }: {
  points: TrendPoint[];
  locale: Locale;
  color: string;
  formatTick: (n: number) => string;
  formatValue: (n: number) => string;
  valueLabel: string;
  ariaLabel: string;
  fixedMax?: number;
}) {
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const [measureRef, width] = useWidth<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);

  const geometry = useMemo(() => {
    const times = points.map((p) => Date.parse(p.t));
    const [t0, t1] = [Math.min(...times), Math.max(...times)];
    const scale = fixedMax === undefined ? niceScale(Math.max(...points.map((p) => p.value))) : { step: fixedMax / 4, top: fixedMax };
    const plotW = Math.max(width - MARGIN.left - MARGIN.right, 1);
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (time: number) => MARGIN.left + (t1 === t0 ? plotW / 2 : ((time - t0) / (t1 - t0)) * plotW);
    const y = (value: number) => MARGIN.top + plotH - (value / scale.top) * plotH;
    const coords = points.map((p, i) => ({ x: x(times[i]), y: y(p.value) }));
    return { times, t0, t1, scale, plotH, x, y, coords };
  }, [points, width, fixedMax]);

  const span = geometry.t1 - geometry.t0;
  // Axis labels follow the span: seconds for a burst of checks, clock times within two days, dates beyond.
  const tickFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, span < TEN_MINUTES_MS ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : span < TWO_DAYS_MS ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" }),
    [locale, span],
  );
  const fullFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: span < ONE_HOUR_MS ? "medium" : "short" }), [locale, span]);

  const select = (index: number) => {
    const point = points[index];
    const at = geometry.coords[index];
    setActive(index);
    setTip({ x: at.x, y: at.y, content: { title: fullFormat.format(new Date(point.t)), rows: [{ swatch: color, label: valueLabel, value: formatValue(point.value) }] } });
  };
  const nearest = (clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return 0;
    const px = clientX - box.left;
    return geometry.coords.reduce((best, c, i) => (Math.abs(c.x - px) < Math.abs(geometry.coords[best].x - px) ? i : best), 0);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    select(Math.min(Math.max((active ?? (step > 0 ? -1 : points.length)) + step, 0), points.length - 1));
  };
  const clear = () => {
    setActive(null);
    setTip(null);
  };

  const line = geometry.coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join("");
  const baseline = MARGIN.top + geometry.plotH;
  const area = `${line}L${geometry.coords.at(-1)?.x.toFixed(1)},${baseline}L${geometry.coords[0]?.x.toFixed(1)},${baseline}Z`;
  const yTicks = [0, 1, 2, 3, 4].map((i) => i * geometry.scale.step);
  const xTicks = Array.from({ length: X_TICKS }, (_, i) => geometry.t0 + (span * i) / (X_TICKS - 1));
  const end = geometry.coords.at(-1);

  return (
    <div
      ref={(el) => { wrap.current = el; rootRef.current = el; measureRef.current = el; }}
      data-in={inView ? "true" : "false"}
      className="relative rounded-md"
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onBlur={clear}
      style={{ height: HEIGHT }}
    >
      {width > 0 && (
        <svg width={width} height={HEIGHT} className="block touch-pan-y" aria-hidden>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke={tick === 0 ? "var(--axis)" : "var(--gridline)"} strokeWidth="1" />
              <text x={MARGIN.left - 8} y={geometry.y(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--chart-label)" className="tabular-nums">{formatTick(tick)}</text>
            </g>
          ))}
          {xTicks.map((time, i) => (
            <text key={time} x={geometry.x(time)} y={HEIGHT - 8} textAnchor={i === 0 ? "start" : i === X_TICKS - 1 ? "end" : "middle"} fontSize="11" fill="var(--chart-label)" className="tabular-nums">{tickFormat.format(new Date(time))}</text>
          ))}
          {/* fill-opacity, not opacity: the entrance animation drives opacity and would override a 0.1 wash. */}
          <path d={area} fill={color} fillOpacity="0.1" className="chart-fade" />
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="chart-line" />
          {end && <circle cx={end.x} cy={end.y} r={DOT} fill={color} stroke="var(--surface)" strokeWidth="2" className="chart-fade" />}
          {active !== null && (
            <g>
              <line x1={geometry.coords[active].x} x2={geometry.coords[active].x} y1={MARGIN.top} y2={baseline} stroke="var(--axis)" strokeWidth="1" />
              <circle cx={geometry.coords[active].x} cy={geometry.coords[active].y} r={DOT + 1} fill={color} stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
          <rect x={MARGIN.left} y={MARGIN.top} width={Math.max(width - MARGIN.left - MARGIN.right, 0)} height={geometry.plotH} fill="transparent" onPointerMove={(e) => select(nearest(e.clientX))} onPointerLeave={clear} />
        </svg>
      )}
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}
