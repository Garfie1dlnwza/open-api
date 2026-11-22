import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "../ui/cx.ts";
import { Sparkline } from "./Sparkline.tsx";
import { useCountUp, useInView } from "./useChart.ts";

export interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
  /** true = the change is good news, false = bad, null = neither (e.g. a count). */
  good: boolean | null;
}

const COUNT_MS = 800;
const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;

/** Label, one number, how it moved, and (optionally) the last few readings. The number counts up on entry. */
export function StatTile({ label, value, format, unit, delta, note, spark, sparkColor = "var(--series-1)", hero, footer }: {
  label: string;
  value: number | null;
  format: (n: number) => string;
  unit?: string;
  delta?: Delta | null;
  note?: string;
  spark?: number[];
  sparkColor?: string;
  hero?: boolean;
  footer?: ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const shown = useCountUp(value, inView, COUNT_MS);
  const Trend = delta ? TREND_ICON[delta.direction] : null;
  return (
    <div ref={ref} title={note} className="flex min-w-0 flex-col gap-2">
      <p className="text-small text-ink-2">{label}</p>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        {/* Large standalone figures use proportional digits; tabular-nums is for aligned columns only. */}
        <p className={cx("font-semibold leading-none tracking-tight", hero ? "text-[56px]" : "text-[30px]")}>
          {shown === null ? "–" : format(shown)}
          {unit && shown !== null && <span className={cx("ml-1 font-medium text-ink-2", hero ? "text-h3" : "text-small")}>{unit}</span>}
        </p>
        {spark && spark.length > 1 && <span className="pb-1"><Sparkline values={spark} color={sparkColor} /></span>}
      </div>
      {delta && Trend && (
        <p className={cx("flex items-center gap-1.5 text-caption", delta.good === true && "text-success-fg", delta.good === false && "text-error-fg", delta.good === null && "text-ink-2")}>
          <Trend aria-hidden size={14} />
          {delta.text}
        </p>
      )}
      {footer}
    </div>
  );
}
