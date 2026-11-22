import type { Status } from "@thai-open-api/schema";
import { cx } from "../ui/cx.ts";
import { STATUS_BAR_CLASS } from "./status.ts";

/**
 * One thin bar per recent probe, oldest on the left, like a status page. Missing history is drawn as
 * short faint ticks so rows line up and "not enough data yet" is visible rather than hidden. The row's
 * status icon carries the meaning for assistive tech; this strip adds the history, with a text label.
 */
export function UptimeStrip({ history, slots, label }: { history: Status[]; slots: number; label: string }) {
  const shown = history.slice(-slots);
  return (
    <span role="img" aria-label={label} title={label} className="hidden h-4 items-end gap-px sm:flex">
      {Array.from({ length: slots - shown.length }, (_, i) => (
        <span key={`gap-${i}`} className="h-1.5 w-[3px] rounded-[1px] bg-line" />
      ))}
      {shown.map((status, i) => (
        <span key={`${i}-${status}`} className={cx("h-4 w-[3px] rounded-[1px]", STATUS_BAR_CLASS[status])} />
      ))}
    </span>
  );
}
