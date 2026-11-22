import type { Locale, Status } from "@thai-open-api/schema";
import { createT } from "../../i18n/index.ts";
import { cx } from "../ui/cx.ts";
import { STATUS_ICON, STATUS_ICON_CLASS, STATUS_PILL_CLASS } from "./status.ts";

type Variant = "icon" | "pill";

/**
 * `icon` (default): just the shape and colour, with the meaning in aria-label and a tooltip, for dense
 * lists. `pill`: icon and word, for the one place a page leads with the status.
 */
export function StatusBadge({ status, locale, variant = "icon", className, size = 18 }: { status: Status; locale: Locale; variant?: Variant; className?: string; size?: number }) {
  const Icon = STATUS_ICON[status];
  const label = createT(locale)(`status.${status}`);
  if (variant === "pill") {
    return (
      <span className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium", STATUS_PILL_CLASS[status], className)}>
        <Icon aria-hidden size={14} />
        {label}
      </span>
    );
  }
  return (
    <span role="img" aria-label={label} title={label} className={cx("inline-flex shrink-0", STATUS_ICON_CLASS[status], className)}>
      <Icon aria-hidden size={size} />
    </span>
  );
}
