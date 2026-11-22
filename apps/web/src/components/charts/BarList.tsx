import type { Locale } from "@thai-open-api/schema";
import { useRef, useState, type ReactNode } from "react";
import { createT } from "../../i18n/index.ts";
import { ChartTooltip, type TipState } from "./ChartTooltip.tsx";
import { useInView, useWidth } from "./useChart.ts";

export interface BarItem {
  key: string;
  label: string;
  value: number;
  href?: string;
  icon?: ReactNode;
  caption?: string;
}

const PERCENT = 100;

/** Ranked horizontal bars: one hue, one baseline, value at the tip. Rows link to the matching explorer view. */
export function BarList({ items, locale, format, fill = "var(--series-1)", total }: { items: BarItem[]; locale: Locale; format: (n: number) => string; fill?: string; total?: number }) {
  const t = createT(locale);
  const [rootRef, inView] = useInView<HTMLDivElement>();
  const [measureRef, width] = useWidth<HTMLDivElement>();
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const max = Math.max(...items.map((i) => i.value), 1);
  const sum = total ?? items.reduce((n, i) => n + i.value, 0);

  const show = (item: BarItem, x: number, y: number) =>
    setTip({ x, y, content: { title: item.label, rows: [{ swatch: fill, label: item.caption ?? (sum > 0 ? `${Math.round((item.value / sum) * PERCENT)}%` : ""), value: format(item.value) }] } });
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
                {...(item.href ? { href: item.href, "aria-label": `${item.label}: ${format(item.value)}. ${t("dashboard.openInExplorer")}` } : { tabIndex: 0 })}
                onPointerMove={pointer(item)}
                onPointerLeave={() => setTip(null)}
                onFocus={focus(item)}
                onBlur={() => setTip(null)}
                className="-mx-2 grid grid-cols-[minmax(5.5rem,10rem)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-subtle focus-visible:bg-subtle"
              >
                <span className="flex min-w-0 items-start gap-2 text-small">
                  {item.icon}
                  <span className="line-clamp-2 break-words leading-snug">{item.label}</span>
                </span>
                <span className="h-2.5" style={{ width: `${(item.value / max) * PERCENT}%`, minWidth: 4 }}>
                  <span className="chart-grow-x block h-full w-full rounded-r-[4px]" style={{ background: fill, "--i": i } as React.CSSProperties} />
                </span>
                <span className="text-right text-small font-semibold tabular-nums">{format(item.value)}</span>
              </Row>
            </li>
          );
        })}
      </ul>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}

