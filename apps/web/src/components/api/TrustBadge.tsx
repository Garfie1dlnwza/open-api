import type { LicenseType, Locale, Source } from "@thai-open-api/schema";
import { BadgeCheck, CircleDashed, Scale, Users, type LucideIcon } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { cx } from "../ui/cx.ts";

const SOURCE_ICON: Record<Source, LucideIcon> = { official: BadgeCheck, community: Users, unofficial: CircleDashed };
const SOURCE_CLASS: Record<Source, string> = {
  official: "bg-brand-100 text-brand-800",
  community: "bg-accent-100 text-accent-800",
  unofficial: "bg-quiet-bg text-quiet-fg",
};

/** Where the API comes from. Kept separate from StatusBadge: provenance is not uptime. */
export function TrustBadge({ source, locale, className }: { source: Source; locale: Locale; className?: string }) {
  const t = createT(locale);
  const Icon = SOURCE_ICON[source];
  return (
    <span title={t(`sourceHint.${source}`)} className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-caption font-medium", SOURCE_CLASS[source], className)}>
      <Icon aria-hidden size={13} />
      {t(`source.${source}`)}
    </span>
  );
}

export function LicenseBadge({ type, verified, locale }: { type: LicenseType; verified: boolean; locale: Locale }) {
  const t = createT(locale);
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-caption font-medium", verified ? "bg-success-bg text-success-fg" : "bg-warning-bg text-warning-fg")}>
      <Scale aria-hidden size={13} />
      {verified ? t(`license.${type}`) : t("license.notVerified")}
    </span>
  );
}
