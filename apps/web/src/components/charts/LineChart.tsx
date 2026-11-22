import type { Locale } from "@thai-open-api/schema";
import { useId, useMemo, useRef, useState } from "react";
import { createT } from "../../i18n/index.ts";
import { chartKeyAction } from "../../lib/chartKeys.ts";
import type { TrendPoint } from "../../lib/dashboard.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { niceScale, useInView, useWidth } from "./useChart.ts";

/** Default plot height; a flat series asks for the compact one so a straight line does not take a whole card. */
export const CHART_HEIGHT = { regular: 224, compact: 168 } as const;
const MARGIN = { top: 12, right: 16, bottom: 30, left: 44 };
const TICK_FONT = 12;
const X_TICKS = 4;
const TWO_DAYS_MS = 172_800_000;
const TEN_MINUTES_MS = 600_000;
const ONE_HOUR_MS = 3_600_000;
const DOT = 4; // marker radius: 8px diameter

/** Time on x (to scale, so gaps look like gaps), one measure on y, starting at zero. 2px line, hairline grid. */
export function LineChart({ points, locale, color, formatTick, formatValue, valueLabel, ariaLabel, fixedMax, height = CHART_HEIGHT.regular }: {
  points: TrendPoint[];
  locale: Locale;
  color: string;
  formatTick: (n: number) => string;
  formatValue: (n: number) => string;
  valueLabel: string;
  ariaLabel: string;
  fixedMax?: number;
  height?: number;
}) {
  const t = createT(locale);
  const hintId = useId();
  const [announce, setAnnounce] = useState("");
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
    const plotH = height - MARGIN.top - MARGIN.bottom;
    const x = (time: number) => MARGIN.left + (t1 === t0 ? plotW / 2 : ((time - t0) / (t1 - t0)) * plotW);
    const y = (value: number) => MARGIN.top + plotH - (value / scale.top) * plotH;
    const coords = points.map((p, i) => ({ x: x(times[i]), y: y(p.value) }));
    return { times, t0, t1, scale, plotH, x, y, coords };
  }, [points, width, fixedMax, height]);

  const span = geometry.t1 - geometry.t0;
  // Axis labels follow the span: seconds for a burst of checks, clock times within two days, dates beyond.
  // A clock time alone is ambiguous once the data crosses midnight, so the date joins it.
  const crossesMidnight = new Date(geometry.t0).toDateString() !== new Date(geometry.t1).toDateString();
  const tickFormat = useMemo(() => {
    if (span < TEN_MINUTES_MS) return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (span < TWO_DAYS_MS) return new Intl.DateTimeFormat(locale, crossesMidnight ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  }, [locale, span, crossesMidnight]);
  const fullFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: span < ONE_HOUR_MS ? "medium" : "short" }), [locale, span]);

  const select = (index: number, spoken = false) => {
    const point = points[index];
    const at = geometry.coords[index];
    const title = fullFormat.format(new Date(point.t));
    setActive(index);
    setTip({ x: at.x, y: at.y, content: { title, rows: [{ swatch: color, label: valueLabel, value: formatValue(point.value) }] } });
    // The readout is a visual tooltip; keyboard users get the same sentence from a polite live region.
    if (spoken) setAnnounce(`${title}: ${valueLabel} ${formatValue(point.value)}`);
  };
  const nearest = (clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return 0;
    const px = clientX - box.left;
    return geometry.coords.reduce((best, c, i) => (Math.abs(c.x - px) < Math.abs(geometry.coords[best].x - px) ? i : best), 0);
  };
  const clear = () => {
    setActive(null);
    setTip(null);
    setAnnounce("");
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const action = chartKeyAction(event.key, active, points.length);
    if (!action) return;
    event.preventDefault();
    if (action.kind === "close") clear();
    else select(action.index, true);
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
      aria-roledescription={t("dashboard.chartRole")}
      aria-label={ariaLabel}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
      onBlur={clear}
      style={{ height }}
    >
      <span id={hintId} className="sr-only">{t("dashboard.chartHint")}</span>
      <span role="status" aria-live="polite" className="sr-only">{announce}</span>
      {width > 0 && (
        <svg width={width} height={height} className="block touch-pan-y" aria-hidden>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke={tick === 0 ? "var(--axis)" : "var(--gridline)"} strokeWidth="1" />
              <text x={MARGIN.left - 8} y={geometry.y(tick)} dy="0.32em" textAnchor="end" fontSize={TICK_FONT} fill="var(--chart-label)" className="tabular-nums">{formatTick(tick)}</text>
            </g>
          ))}
          {xTicks.map((time, i) => (
            <text key={time} x={geometry.x(time)} y={height - 8} textAnchor={i === 0 ? "start" : i === X_TICKS - 1 ? "end" : "middle"} fontSize={TICK_FONT} fill="var(--chart-label)" className="tabular-nums">{tickFormat.format(new Date(time))}</text>
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
