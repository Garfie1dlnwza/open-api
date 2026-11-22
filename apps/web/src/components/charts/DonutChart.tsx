import type { Locale } from "@thai-open-api/schema";
import { useRef, useState } from "react";
import { createT } from "../../i18n/index.ts";
import { sharePercents } from "../../lib/shares.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { useInView, useWidth } from "./useChart.ts";

export interface Slice {
  key: string;
  label: string;
  value: number;
  fill: string;
  href?: string;
}

const PERCENT = 100;
const GAP = 1.4; // surface gap between slices, in path-length units (of 100)
const R = 38;

/** Part-to-whole for a handful of parts: the donut carries the total, the legend carries every figure. */
export function DonutChart({ slices, locale, centerLabel, format }: { slices: Slice[]; locale: Locale; centerLabel: string; format: (n: number) => string }) {
  const t = createT(locale);
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const [measureRef, width] = useWidth<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const total = slices.reduce((n, s) => n + s.value, 0);
  // Largest-remainder rounding, so the legend adds up to 100% instead of 99 or 101.
  const shares = sharePercents(slices.map((s) => s.value));
  const share = (s: Slice) => shares[slices.indexOf(s)];

  let cursor = 0;
  const arcs = slices.map((slice) => {
    const pct = (slice.value / total) * PERCENT;
    const arc = { slice, length: Math.max(pct - (slices.length > 1 ? GAP : 0), 0.01), start: cursor + GAP / 2 };
    cursor += pct;
    return arc;
  });

  const move = (slice: Slice) => (event: React.PointerEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    setActive(slice.key);
    if (box) setTip({ x: event.clientX - box.left, y: event.clientY - box.top, content: { title: slice.label, rows: [{ swatch: slice.fill, label: `${share(slice)}%`, value: format(slice.value) }] } });
  };
  const leave = () => {
    setActive(null);
    setTip(null);
  };

  return (
    <div ref={(el) => { wrap.current = el; rootRef.current = el; measureRef.current = el; }} data-in={inView ? "true" : "false"} className="relative flex flex-wrap items-center gap-x-8 gap-y-4">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 100 100" role="img" aria-label={`${centerLabel}: ${format(total)}`} className="size-full -rotate-90">
          {arcs.map(({ slice, length, start }, i) => (
            <circle
              key={slice.key}
              cx="50" cy="50" r={R} fill="none" strokeWidth="12" pathLength={PERCENT}
              stroke={slice.fill}
              strokeDasharray={`${length} ${PERCENT - length}`}
              strokeDashoffset={-start}
              className="chart-arc cursor-pointer transition-opacity duration-150"
              style={{ opacity: active && active !== slice.key ? 0.35 : 1, "--i": i } as React.CSSProperties}
              onPointerMove={move(slice)}
              onPointerLeave={leave}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-h2 font-semibold leading-none">{format(total)}</span>
          <span className="mt-1 text-caption text-ink-2">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex min-w-44 flex-1 flex-col">
        {slices.map((slice) => {
          const Row = slice.href ? "a" : "div";
          return (
            <li key={slice.key}>
              <Row
                {...(slice.href ? { href: slice.href, "aria-label": `${slice.label}: ${format(slice.value)}. ${t("dashboard.openInExplorer")}` } : { tabIndex: 0 })}
                onPointerEnter={() => setActive(slice.key)}
                onPointerLeave={leave}
                onFocus={() => setActive(slice.key)}
                onBlur={leave}
                className="-mx-2 grid grid-cols-[auto_minmax(0,1fr)_auto_2.75rem] items-start gap-2.5 rounded-md px-2 py-1.5 text-small transition-colors duration-150 hover:bg-subtle focus-visible:bg-subtle"
              >
                <span aria-hidden className="size-3 rounded-[3px]" style={{ background: slice.fill }} />
                <span className="break-words leading-snug">{slice.label}</span>
                <strong className="font-semibold tabular-nums">{format(slice.value)}</strong>
                <span className="text-right text-ink-2 tabular-nums">{share(slice)}%</span>
              </Row>
            </li>
          );
        })}
      </ul>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}
