import type { LicenseType, Locale, Source } from "@thai-open-api/schema";
import { BadgeCheck, CircleDashed, Scale, Users, type LucideIcon } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { cx } from "../ui/cx.ts";

export const SOURCE_ICON: Record<Source, LucideIcon> = { official: BadgeCheck, community: Users, unofficial: CircleDashed };
const SOURCE_COLOR: Record<Source, string> = { official: "text-brand-700", community: "text-accent-700", unofficial: "text-ink-3" };

/**
 * Where the API comes from, kept apart from status. Default is the bare icon with the meaning in
 * its accessible name and tooltip; `text` adds the word for places that lead with it.
 */
export function TrustBadge({ source, locale, variant = "icon", className }: { source: Source; locale: Locale; variant?: "icon" | "text"; className?: string }) {
  const t = createT(locale);
  const Icon = SOURCE_ICON[source];
  const label = t(`source.${source}`);
  if (variant === "text") {
    return (
      <span title={t(`sourceHint.${source}`)} className={cx("inline-flex items-center gap-1.5 text-small font-medium", className)}>
        <Icon aria-hidden size={16} className={SOURCE_COLOR[source]} />
        {label}
      </span>
    );
  }
  return (
    <span role="img" aria-label={label} title={`${label} · ${t(`sourceHint.${source}`)}`} className={cx("inline-flex shrink-0", SOURCE_COLOR[source], className)}>
      <Icon aria-hidden size={16} />
    </span>
  );
}

export function LicenseBadge({ type, verified, locale }: { type: LicenseType; verified: boolean; locale: Locale }) {
  const t = createT(locale);
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-small font-medium", verified ? "text-success-fg" : "text-warning-fg")}>
      <Scale aria-hidden size={16} />
      {verified ? t(`license.${type}`) : t("license.notVerified")}
    </span>
  );
}
