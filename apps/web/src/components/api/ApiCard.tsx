import type { Locale } from "@thai-open-api/schema";
import { KeyRound, LockOpen } from "lucide-react";
import { ROUTES } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { StatusBadge } from "./StatusBadge.tsx";
import { TrustBadge } from "./TrustBadge.tsx";

/** Only facts that help someone decide whether to open the API. */
export function ApiCard({ api, locale }: { api: ApiSummary; locale: Locale }) {
  const t = createT(locale);
  const AuthIcon = api.auth === "none" ? LockOpen : KeyRound;
  return (
    <article className="relative flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-line-strong">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-h4 font-semibold">
            <a href={ROUTES.api(locale, api.id)} className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-brand-700">
              {api.name}
            </a>
          </h3>
          <p className="truncate text-small text-ink-2">{api.provider}</p>
        </div>
        <StatusBadge status={api.status} locale={locale} />
      </header>
      <p className="line-clamp-2 text-small text-ink-2">{api.description}</p>
      <footer className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-caption text-ink-2">
        <TrustBadge source={api.source} locale={locale} />
        <span>{api.categoryLabel}</span>
        <span className="inline-flex items-center gap-1">
          <AuthIcon aria-hidden size={13} />
          {t(`auth.${api.auth}`)}
        </span>
        <span className="ml-auto" title={api.reviewedAt}>
          {t("api.lastVerified", { when: api.verifiedLabel })}
        </span>
      </footer>
    </article>
  );
}
