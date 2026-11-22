import type { Category } from "@thai-open-api/schema";
import { cx } from "../ui/cx.ts";
import { CATEGORY_ICON } from "./categoryIcon.ts";

/** A link (home page) or a toggle (explorer filter) with the same look. */
export function CategoryChip({ label, count, href, selected, onToggle, category }: { label: string; count?: number; href?: string; selected?: boolean; onToggle?: () => void; category?: Category }) {
  const className = cx(
    "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-small font-medium transition-colors duration-150",
    selected ? "border-brand-700 bg-brand-100 text-brand-800" : "border-control bg-surface text-ink hover:bg-subtle",
  );
  const Icon = category ? CATEGORY_ICON[category] : null;
  const body = (
    <>
      {Icon && <Icon aria-hidden size={16} />}
      <span>{label}</span>
      {count !== undefined && <span className="text-caption text-ink-2">{count}</span>}
    </>
  );
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <button type="button" aria-pressed={selected} onClick={onToggle} className={className}>
      {body}
    </button>
  );
}
