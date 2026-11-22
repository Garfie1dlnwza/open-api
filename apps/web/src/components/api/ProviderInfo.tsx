import type { Locale } from "@thai-open-api/schema";
import { Building2, ExternalLink } from "lucide-react";
import { createT } from "../../i18n/index.ts";

export function ProviderInfo({ name, url, locale }: { name: string; url?: string; locale: Locale }) {
  const t = createT(locale);
  return (
    <p className="flex flex-wrap items-center gap-2 text-small">
      <Building2 aria-hidden size={16} className="text-ink-3" />
      <span className="font-medium">{name}</span>
      {url && (
        <a href={url} rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
          {t("api.providerSite")}
          <ExternalLink aria-hidden size={13} />
        </a>
      )}
    </p>
  );
}
