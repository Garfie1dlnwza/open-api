import type { Status } from "@thai-open-api/schema";
import type { Locale } from "@thai-open-api/schema";
import { CircleCheck, CircleHelp, CircleX, KeyRound, TriangleAlert, type LucideIcon } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { cx } from "../ui/cx.ts";

const STYLE: Record<Status, { icon: LucideIcon; classes: string }> = {
  operational: { icon: CircleCheck, classes: "bg-success-bg text-success-fg" },
  degraded: { icon: TriangleAlert, classes: "bg-warning-bg text-warning-fg" },
  outage: { icon: CircleX, classes: "bg-error-bg text-error-fg" },
  unknown: { icon: CircleHelp, classes: "bg-neutral-bg text-neutral-fg" },
  auth_required: { icon: KeyRound, classes: "bg-info-bg text-info-fg" },
};

/** Always icon + text: colour alone never carries the status. */
export function StatusBadge({ status, locale, className }: { status: Status; locale: Locale; className?: string }) {
  const { icon: Icon, classes } = STYLE[status];
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium", classes, className)}>
      <Icon aria-hidden size={14} />
      {createT(locale)(`status.${status}`)}
    </span>
  );
}
