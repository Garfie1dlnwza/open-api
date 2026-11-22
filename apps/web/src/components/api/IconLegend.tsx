import { STATUSES, type Locale } from "@thai-open-api/schema";
import { Clock, KeyRound, ShieldCheck, ShieldQuestion } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { STATUS_ICON, STATUS_ICON_CLASS } from "./status.ts";
import { SOURCE_ICON } from "./TrustBadge.tsx";

export type LegendKind = "status" | "source" | "auth" | "license" | "date";

/** The icons used on a page, named once in a quiet line, so nobody has to guess what a key or a triangle means. */
export function IconLegend({ kinds, locale }: { kinds: LegendKind[]; locale: Locale }) {
  const t = createT(locale);
  const items = kinds.flatMap((kind) => {
    if (kind === "status") {
      return STATUSES.filter((s) => s !== "unknown" || kinds.length === 1).map((s) => {
        const Icon = STATUS_ICON[s];
        return { key: `status-${s}`, label: t(`status.${s}`), icon: <Icon aria-hidden size={14} className={STATUS_ICON_CLASS[s]} /> };
      });
    }
    if (kind === "source") {
      return (["official", "community", "unofficial"] as const).map((s) => {
        const Icon = SOURCE_ICON[s];
        return { key: `source-${s}`, label: t(`source.${s}`), icon: <Icon aria-hidden size={14} className="text-ink-3" /> };
      });
    }
    if (kind === "auth") return [{ key: "auth", label: t("auth.apiKey"), icon: <KeyRound aria-hidden size={14} className="text-ink-3" /> }];
    if (kind === "license") {
      return [
        { key: "license-ok", label: t("license.verified"), icon: <ShieldCheck aria-hidden size={14} className="text-success-fg" /> },
        { key: "license-no", label: t("license.notVerified"), icon: <ShieldQuestion aria-hidden size={14} className="text-ink-3" /> },
      ];
    }
    return [{ key: "date", label: t("legend.date"), icon: <Clock aria-hidden size={14} className="text-ink-3" /> }];
  });
  return (
    <ul aria-label={t("legend.title")} className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-2">
      {items.map((item) => (
        <li key={item.key} className="inline-flex items-center gap-1.5">
          {item.icon}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
