import { localize, type Endpoint, type Locale, type SampleLang, type Status } from "@thai-open-api/schema";
import { createT } from "../../i18n/index.ts";
import { CodeBlock } from "../playground/CodeBlock.tsx";
import { Tabs } from "../ui/Tabs.tsx";
import { CodeTabs } from "./CodeTabs.tsx";
import { ParameterTable } from "./ParameterTable.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

export interface EndpointViewProps {
  endpoint: Endpoint;
  locale: Locale;
  status: Status;
  exampleVerified: boolean;
  samples: Record<SampleLang, string> | null;
}

export function EndpointCard({ endpoint, locale, status, exampleVerified, samples }: EndpointViewProps) {
  const t = createT(locale);
  const items = [
    { id: "params", label: t("api.parameters"), content: <ParameterTable params={endpoint.params} locale={locale} /> },
    {
      id: "response",
      label: t("api.exampleResponse"),
      content: endpoint.response.sample ? (
        <div className="flex flex-col gap-2">
          <CodeBlock code={endpoint.response.sample.trim()} label={t("api.format", { format: endpoint.response.format.toUpperCase() })} locale={locale} />
          <p className="text-caption text-ink-2">{t("api.sampleExcerpt")} {exampleVerified ? t("api.verifiedExampleYes") : t("api.verifiedExampleNo")}</p>
        </div>
      ) : (
        <p className="text-small text-ink-2">{t("api.noSample")}</p>
      ),
    },
    ...(samples ? [{ id: "code", label: t("api.tabLabel"), content: <CodeTabs samples={samples} locale={locale} /> }] : []),
  ];

  return (
    <article id={`endpoint-${endpoint.id}`} className="scroll-mt-24 rounded-lg border border-line bg-surface p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand-100 px-2 py-0.5 font-mono text-caption font-medium text-brand-fg">{endpoint.method}</span>
          <h3 className="text-h4 font-semibold">{localize(endpoint.title, locale)}</h3>
        </div>
        <StatusBadge status={status} locale={locale} />
      </header>
      <p className="mt-2 break-all rounded-md bg-subtle px-3 py-2 font-mono text-code text-ink">{endpoint.path}</p>
      <p className="mt-3 text-small text-ink-2">{localize(endpoint.description, locale)}</p>
      <Tabs className="mt-4" label={localize(endpoint.title, locale)} items={items} />
    </article>
  );
}
