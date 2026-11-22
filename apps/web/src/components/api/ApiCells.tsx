import type { Locale } from "@thai-open-api/schema";
import { KeyRound, ShieldCheck, ShieldQuestion } from "lucide-react";
import { createT, type Translate } from "../../i18n/index.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { TrustBadge } from "./TrustBadge.tsx";

/** A keyed API's status already IS "needs a key", so a second key would say the same thing twice. */
export const showsKey = (api: ApiSummary): boolean => api.auth === "apiKey" && api.status !== "auth_required";

/** Full dates for the tooltip: when a person last reviewed the entry, and when the probe last ran. */
export const dateTip = (api: ApiSummary, t: Translate): string =>
  [t("api.lastVerified", { when: api.verifiedLabel }), api.checkedLabel ? t("api.healthChecked", { when: api.checkedLabel }) : null].filter(Boolean).join(" · ");

/** Where the API comes from, plus a key when one is still needed. Shared by the list row and the table. */
export function ApiSourceIcons({ api, locale }: { api: ApiSummary; locale: Locale }) {
  const t = createT(locale);
  return (
    <span className="inline-flex items-center gap-2.5">
      <TrustBadge source={api.source} locale={locale} />
      {showsKey(api) && (
        <span role="img" aria-label={t("auth.apiKey")} title={t("auth.apiKey")} className="inline-flex">
          <KeyRound aria-hidden size={16} />
        </span>
      )}
    </span>
  );
}

/** Licence review: a green shield when a person verified it, otherwise a muted question mark. */
export function ApiLicenseIcon({ api, locale, onlyVerified = false }: { api: ApiSummary; locale: Locale; onlyVerified?: boolean }) {
  const t = createT(locale);
  if (api.license.verified) {
    return (
      <span role="img" aria-label={t("license.verified")} title={t("license.verified")} className="inline-flex text-success-fg">
        <ShieldCheck aria-hidden size={16} />
      </span>
    );
  }
  if (onlyVerified) return null;
  return (
    <span role="img" aria-label={t("license.notVerified")} title={t("license.notVerified")} className="inline-flex text-ink-3">
      <ShieldQuestion aria-hidden size={16} />
    </span>
  );
}

export function ApiReviewed({ api, locale }: { api: ApiSummary; locale: Locale }) {
  const tip = dateTip(api, createT(locale));
  return (
    <time dateTime={api.reviewedAt} title={tip} aria-label={tip} className="text-caption tabular-nums">
      {api.verifiedShort}
    </time>
  );
}
