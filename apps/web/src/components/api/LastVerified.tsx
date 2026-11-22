import type { Locale } from "@thai-open-api/schema";
import { Clock } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { formatDate } from "../../lib/format.ts";

export function LastVerified({ iso, relative, locale, labelKey = "api.lastVerified" }: { iso: string; relative: string; locale: Locale; labelKey?: "api.lastVerified" | "api.healthChecked" }) {
  const t = createT(locale);
  return (
    <span className="inline-flex items-center gap-1.5 text-small text-ink-2">
      <Clock aria-hidden size={14} />
      <time dateTime={iso} title={formatDate(iso, locale)}>
        {t(labelKey, { when: relative })}
      </time>
    </span>
  );
}
