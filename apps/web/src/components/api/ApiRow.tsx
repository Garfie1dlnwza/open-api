import type { Locale } from "@thai-open-api/schema";
import { KeyRound } from "lucide-react";
import { ROUTES } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { StatusBadge } from "./StatusBadge.tsx";
import { TrustBadge } from "./TrustBadge.tsx";

const STAGGER_CAP = 8;

/**
 * One API as one line of a ruled list. Status, source and "needs a key" are icons (their meaning is in
 * the accessible name and tooltip) so the row stays quiet; the words appear on the detail page.
 */
export function ApiRow({ api, locale, index = 0 }: { api: ApiSummary; locale: Locale; index?: number }) {
  const t = createT(locale);
  return (
    <a
      href={ROUTES.api(locale, api.id)}
      className="anim-rise group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors duration-150 hover:bg-subtle focus-visible:bg-subtle md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.5fr)_auto]"
      style={{ "--i": Math.min(index, STAGGER_CAP) } as React.CSSProperties}
    >
      <StatusBadge status={api.status} locale={locale} size={20} />
      <span className="min-w-0">
        <strong className="block truncate text-small font-semibold transition-colors duration-150 group-hover:text-brand-700">{api.name}</strong>
        <span className="block truncate text-caption text-ink-2">{api.provider}</span>
      </span>
      <span className="col-span-2 col-start-2 row-start-2 line-clamp-2 text-small text-ink-2 md:col-span-1 md:col-start-auto md:row-start-auto">{api.description}</span>
      <span className="flex items-center gap-3 justify-self-end text-ink-3">
        <TrustBadge source={api.source} locale={locale} />
        {api.auth === "apiKey" && (
          <span role="img" aria-label={t("auth.apiKey")} title={t("auth.apiKey")} className="inline-flex">
            <KeyRound aria-hidden size={16} />
          </span>
        )}
        <time dateTime={api.reviewedAt} title={t("api.lastVerified", { when: api.verifiedLabel })} className="w-12 text-right text-caption tabular-nums">
          {api.verifiedShort}
        </time>
      </span>
    </a>
  );
}
