import type { Status } from "@thai-open-api/schema";
import { CircleCheck, CircleHelp, CircleX, KeyRound, TriangleAlert, type LucideIcon } from "lucide-react";

/** One shape per status, so meaning survives without colour (and without a visible label). */
export const STATUS_ICON: Record<Status, LucideIcon> = {
  operational: CircleCheck,
  degraded: TriangleAlert,
  outage: CircleX,
  unknown: CircleHelp,
  auth_required: KeyRound,
};

export const STATUS_ICON_CLASS: Record<Status, string> = {
  operational: "text-success-dot",
  degraded: "text-warning-dot",
  outage: "text-error-dot",
  unknown: "text-ink-3",
  auth_required: "text-info-dot",
};

export const STATUS_PILL_CLASS: Record<Status, string> = {
  operational: "bg-success-bg text-success-fg",
  degraded: "bg-warning-bg text-warning-fg",
  outage: "bg-error-bg text-error-fg",
  unknown: "bg-quiet-bg text-quiet-fg",
  auth_required: "bg-info-bg text-info-fg",
};

/** One bar of an uptime strip. Unknown and key-gated checks stay quiet so real failures stand out. */
export const STATUS_BAR_CLASS: Record<Status, string> = {
  operational: "bg-success-dot",
  degraded: "bg-warning-dot",
  outage: "bg-error-dot",
  auth_required: "bg-info-dot/45",
  unknown: "bg-line-strong",
};

/** Fill and label colour of each status inside charts (tokens, validated for contrast). */
export const STATUS_FILL: Record<Status, { fill: string; ink: string }> = {
  operational: { fill: "var(--status-good)", ink: "var(--on-good)" },
  degraded: { fill: "var(--status-warning)", ink: "var(--on-warning)" },
  outage: { fill: "var(--status-critical)", ink: "var(--on-critical)" },
  auth_required: { fill: "var(--status-info)", ink: "var(--on-info)" },
  unknown: { fill: "var(--status-unknown)", ink: "var(--on-unknown)" },
};

/** Healthiest first, which also reads left to right as "good to bad". */
export const STATUS_ORDER: Status[] = ["operational", "degraded", "outage", "auth_required", "unknown"];
