import type { LucideIcon } from "lucide-react";
import { cx } from "../ui/cx.ts";

/** One selectable row of a filter list: icon, name, and how many results it would give. */
export function FacetOption({ label, count, selected, onToggle, icon: Icon, iconClass }: { label: string; count: number; selected: boolean; onToggle: () => void; icon?: LucideIcon; iconClass?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cx(
        "group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-small transition-colors duration-150",
        selected ? "bg-brand-50 font-semibold text-brand-fg" : "text-ink hover:bg-subtle",
        count === 0 && !selected && "text-ink-3",
      )}
    >
      {Icon && <Icon aria-hidden size={16} className={cx("shrink-0", selected ? "text-link" : (iconClass ?? "text-ink-3"))} />}
      <span className="flex-1 truncate">{label}</span>
      <span className={cx("text-caption tabular-nums", selected ? "text-link" : "text-ink-3")}>{count}</span>
    </button>
  );
}
