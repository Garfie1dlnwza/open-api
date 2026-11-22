import type { Locale } from "@thai-open-api/schema";
import { useRef, useState, type ReactNode } from "react";
import { createT } from "../../i18n/index.ts";
import { sharePercents } from "../../lib/shares.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { useInView, useWidth } from "./useChart.ts";

export interface BarItem {
  key: string;
  label: string;
  value: number;
  href?: string;
  icon?: ReactNode;
  /** Tooltip detail line; defaults to the item's share of the whole. */
  caption?: string;
  /** What the value column prints when a bare number is not enough ("7 of 7 checks", "4 APIs"). */
  valueText?: string;
  /** Own bar colour, for rows whose severity differs. */
  fill?: string;
}

const PERCENT = 100;

/** Ranked horizontal bars: one hue, one baseline, value at the tip. Rows link to the matching explorer view. */
export function BarList({ items, locale, format, fill = "var(--series-1)", total, valueWidth = "2.5rem" }: { items: BarItem[]; locale: Locale; format: (n: number) => string; fill?: string; total?: number; valueWidth?: string }) {
  const t = createT(locale);
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const [measureRef, width] = useWidth<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const max = Math.max(...items.map((i) => i.value), 1);
  const sum = total ?? items.reduce((n, i) => n + i.value, 0);
  const shares = sharePercents(items.map((i) => i.value));
  const columns = `minmax(5.5rem,10rem) minmax(0,1fr) ${valueWidth}`;

  const show = (item: BarItem, x: number, y: number) =>
    setTip({ x, y, content: { title: item.label, rows: [{ swatch: item.fill ?? fill, label: item.caption ?? (sum > 0 ? `${shares[items.indexOf(item)]}%` : ""), value: item.valueText ?? format(item.value) }] } });
  const pointer = (item: BarItem) => (event: React.PointerEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    if (box) show(item, event.clientX - box.left, event.clientY - box.top);
  };
  const focus = (item: BarItem) => (event: React.FocusEvent) => {
    const box = wrap.current?.getBoundingClientRect();
    const row = event.currentTarget.getBoundingClientRect();
    if (box) show(item, row.left - box.left + row.width / 2, row.top - box.top);
  };

  return (
    <div ref={(el) => { wrap.current = el; rootRef.current = el; measureRef.current = el; }} data-in={inView ? "true" : "false"} className="relative">
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const Row = item.href ? "a" : "div";
          return (
            <li key={item.key}>
              <Row
                {...(item.href ? { href: item.href, "aria-label": `${item.label}: ${item.valueText ?? format(item.value)}. ${t("dashboard.openInExplorer")}` } : { tabIndex: 0 })}
                onPointerMove={pointer(item)}
                onPointerLeave={() => setTip(null)}
                onFocus={focus(item)}
                onBlur={() => setTip(null)}
                style={{ gridTemplateColumns: columns }}
                className="-mx-2 grid items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-subtle focus-visible:bg-subtle"
              >
                <span className="flex min-w-0 items-start gap-2 text-small">
                  {item.icon}
                  <span className="line-clamp-2 break-words leading-snug">{item.label}</span>
                </span>
                <span className="h-2.5" style={{ width: `${(item.value / max) * PERCENT}%`, minWidth: 4 }}>
                  <span className="chart-grow-x block h-full w-full rounded-r-[4px]" style={{ background: item.fill ?? fill, "--i": i } as React.CSSProperties} />
                </span>
                <span className="text-right text-small font-semibold tabular-nums">{item.valueText ?? format(item.value)}</span>
              </Row>
            </li>
          );
        })}
      </ul>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}

