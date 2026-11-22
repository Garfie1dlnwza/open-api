import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../ui/cx.ts";

/**
 * One option of a filter group. A checkbox makes "selected" unmistakable (not just a tint), the icon names
 * the value, and the count says how many APIs it would show. An option that would show none is disabled
 * (still listed, so you can see the category exists) unless it is the one currently selected.
 */
export function FacetOption({ label, count, countLabel, selected, onToggle, icon: Icon, iconClass }: { label: string; count: number; countLabel: string; selected: boolean; onToggle: () => void; icon?: LucideIcon; iconClass?: string }) {
  const unavailable = count === 0 && !selected;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={unavailable}
      aria-label={`${label}, ${countLabel}`}
      onClick={onToggle}
      className={cx(
        "group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-small transition-colors duration-150 disabled:cursor-not-allowed",
        selected ? "bg-brand-50 font-semibold text-brand-fg" : "text-ink enabled:hover:bg-subtle",
        unavailable && "text-ink-3",
      )}
    >
      <span aria-hidden className={cx("grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-150", selected ? "border-link bg-fill text-on-brand" : "border-control bg-surface", unavailable && "opacity-50")}>
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      {Icon && <Icon aria-hidden size={16} className={cx("shrink-0", selected ? "text-link" : (iconClass ?? "text-ink-3"), unavailable && "opacity-50")} />}
      <span className="flex-1 truncate">{label}</span>
      <span title={countLabel} className={cx("font-mono text-caption tabular-nums", selected ? "text-link" : "text-ink-3")}>{count}</span>
    </button>
  );
}
