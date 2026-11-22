import type { Locale } from "@thai-open-api/schema";
import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { createT } from "../../i18n/index.ts";
import { sharePercents } from "../../lib/shares.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { useInView, useWidth } from "./useChart.ts";

export interface Segment {
  key: string;
  label: string;
  value: number;
  fill: string;
  ink: string;
  icon?: LucideIcon;
  href?: string;
}

const PERCENT = 100;
/** A block narrower than this share of the bar prints no number: the legend and tooltip carry it. */
const MIN_LABEL_SHARE = 9;

/** One whole split into a few parts, read at a glance. Tall, 4px corners, 2px gaps; the legend names every part. */
export function SegmentedBar({ segments, locale, ariaLabel, format }: { segments: Segment[]; locale: Locale; ariaLabel: string; format: (n: number) => string }) {
  const t = createT(locale);
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const [measureRef, width] = useWidth<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((n, s) => n + s.value, 0);
  const shares = sharePercents(shown.map((s) => s.value));

  const point = (segment: Segment, x: number, y: number) =>
    setTip({ x, y, content: { title: segment.label, rows: [{ swatch: segment.fill, label: `${shares[shown.indexOf(segment)]}%`, value: format(segment.value) }] } });
  const move = (segment: Segment) => (event: React.PointerEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    if (box) point(segment, event.clientX - box.left, event.clientY - box.top);
  };
  const focus = (segment: Segment) => (event: React.FocusEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    const seg = event.currentTarget.getBoundingClientRect();
    if (box) point(segment, seg.left - box.left + seg.width / 2, seg.top - box.top);
  };

  return (
    <div ref={(el) => { wrap.current = el; rootRef.current = el; measureRef.current = el; }} data-in={inView ? "true" : "false"} className="relative flex flex-col gap-4">
      <div role="img" aria-label={ariaLabel} className="flex h-7 gap-0.5">
        {shown.map((segment, i) => {
          const Seg = segment.href ? "a" : "div";
          const pct = (segment.value / total) * PERCENT;
          return (
            <Seg
              key={segment.key}
              {...(segment.href ? { href: segment.href, "aria-label": `${segment.label}: ${format(segment.value)}. ${t("dashboard.openInExplorer")}` } : {})}
              onPointerMove={move(segment)}
              onPointerLeave={() => setTip(null)}
              onFocus={focus(segment)}
              onBlur={() => setTip(null)}
              className="chart-grow-x flex min-w-1 items-center overflow-hidden rounded-[4px] px-2 text-caption font-semibold tabular-nums transition-[filter] duration-150 hover:brightness-110 focus-visible:brightness-110"
              style={{ flex: `${segment.value} 1 0`, background: segment.fill, color: segment.ink, "--i": i } as React.CSSProperties}
            >
              {pct >= MIN_LABEL_SHARE ? format(segment.value) : null}
            </Seg>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-small" style={{ opacity: segment.value > 0 ? 1 : 0.55 }}>
            {segment.icon ? <segment.icon aria-hidden size={16} style={{ color: segment.fill }} /> : <span aria-hidden className="size-3 rounded-[3px]" style={{ background: segment.fill }} />}
            <span>{segment.label}</span>
            <strong className="font-semibold tabular-nums">{format(segment.value)}</strong>
          </li>
        ))}
      </ul>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}
