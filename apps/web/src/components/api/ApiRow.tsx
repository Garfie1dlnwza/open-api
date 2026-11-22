import type { Locale } from "@thai-open-api/schema";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { ROUTES } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { StatusBadge } from "./StatusBadge.tsx";
import { TrustBadge } from "./TrustBadge.tsx";

const STAGGER_CAP = 8;

/**
 * One API as one line of a ruled list. Status, source and "needs a key" are icons (named once in the
 * legend and in each icon's accessible name). The whole row is the link: on hover or focus a bar slides
 * in on the left, the row tints and a chevron appears, so it reads as clickable without a button.
 */
export function ApiRow({ api, locale, index = 0 }: { api: ApiSummary; locale: Locale; index?: number }) {
  const t = createT(locale);
  return (
    <a
      href={ROUTES.api(locale, api.id)}
      className="anim-rise group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors duration-150 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:scale-y-0 before:bg-link before:transition-transform before:duration-200 hover:bg-brand-50 hover:before:scale-y-100 focus-visible:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 focus-visible:before:scale-y-100 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.5fr)_9.5rem]"
      style={{ "--i": Math.min(index, STAGGER_CAP) } as React.CSSProperties}
    >
      <StatusBadge status={api.status} locale={locale} size={20} />
      <span className="min-w-0">
        <strong className="line-clamp-2 break-words text-small font-semibold leading-snug transition-colors duration-150 group-hover:text-link">{api.name}</strong>
        <span className="line-clamp-2 break-words text-caption leading-snug text-ink-2">{api.provider}</span>
      </span>
      <span className="col-span-2 col-start-2 row-start-2 line-clamp-2 text-small text-ink-2 md:col-span-1 md:col-start-auto md:row-start-auto">{api.description}</span>
      <span className="flex items-center justify-end gap-3 text-ink-3">
        <TrustBadge source={api.source} locale={locale} />
        {api.license.verified && (
          <span role="img" aria-label={t("license.verified")} title={t("license.verified")} className="inline-flex text-success-fg">
            <ShieldCheck aria-hidden size={16} />
          </span>
        )}
        {api.auth === "apiKey" && (
          <span role="img" aria-label={t("auth.apiKey")} title={t("auth.apiKey")} className="inline-flex">
            <KeyRound aria-hidden size={16} />
          </span>
        )}
        <time dateTime={api.reviewedAt} title={t("api.lastVerified", { when: api.verifiedLabel })} className="w-12 text-right text-caption tabular-nums">
          {api.verifiedShort}
        </time>
        <ChevronRight aria-hidden size={16} className="-ml-1 -translate-x-1 text-link opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
      </span>
    </a>
  );
}
