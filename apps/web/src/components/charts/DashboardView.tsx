import { SOURCES, type Locale, type Source, type Status } from "@thai-open-api/schema";
import { Info } from "lucide-react";
import { QUERY, ROUTES } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { DashboardData } from "../../lib/dashboard.ts";
import { CATEGORY_ICON } from "../api/categoryIcon.ts";
import { STATUS_FILL, STATUS_ICON, STATUS_ICON_CLASS, STATUS_ORDER } from "../api/status.ts";
import { BarList } from "./BarList.tsx";
import { ChartCard } from "./ChartCard.tsx";
import { DonutChart } from "./DonutChart.tsx";
import { LineChart } from "./LineChart.tsx";
import { SegmentedBar } from "./SegmentedBar.tsx";
import { StatTile, type Delta } from "./StatTile.tsx";

const SOURCE_FILL: Record<Source, string> = { official: "var(--series-1)", community: "var(--series-2)", unofficial: "var(--series-3)" };
const PERCENT_SCALE = 100;
const ONE_DECIMAL = 10;

const delta = (change: number | null, t: ReturnType<typeof createT>): Delta | null => {
  if (change === null) return null;
  const n = Math.abs(change);
  if (change === 0) return { text: t("dashboard.delta.flat"), direction: "flat", good: null };
  return change > 0 ? { text: t("dashboard.delta.up", { n }), direction: "up", good: true } : { text: t("dashboard.delta.down", { n }), direction: "down", good: false };
};

function Collecting({ count, locale }: { count: number; locale: Locale }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-subtle px-3 py-4 text-small text-ink-2">
      <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
      {createT(locale)("dashboard.collecting", { count })}
    </p>
  );
}

export function DashboardView({ data, names, locale }: { data: DashboardData; names: Record<string, string>; locale: Locale }) {
  const t = createT(locale);
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const count = (n: number) => nf.format(Math.round(n));
  const pct = (n: number) => t("dashboard.percentValue", { n: nf.format(Math.round(n * ONE_DECIMAL) / ONE_DECIMAL) });
  const ms = (n: number) => t("common.ms", { n: nf.format(Math.round(n)) });
  const explore = (key: string, value: string) => `${ROUTES.explore(locale)}?${key}=${value}`;
  const { kpis } = data;
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const hasTrend = data.availabilityTrend.length >= 2;
  const trendOf = (points: { value: number }[]) => points.map((p) => p.value);

  const healthSegments = STATUS_ORDER.map((status: Status) => ({
    key: status,
    label: t(`status.${status}`),
    value: data.endpointHealth[status],
    ...STATUS_FILL[status],
    icon: STATUS_ICON[status],
    href: explore(QUERY.status, status),
  }));
  const licenseSegments = [
    { key: "verified", label: t("dashboard.licenseStates.verified"), value: data.license.verified, fill: "var(--series-1)", ink: "var(--on-series-1)" },
    { key: "declared", label: t("dashboard.licenseStates.declared"), value: data.license.declared, fill: "var(--series-1-light)", ink: "var(--on-series-1-light)" },
    { key: "unknown", label: t("dashboard.licenseStates.unknown"), value: data.license.unknown, fill: "var(--series-other)", ink: "var(--on-series-other)" },
  ];
  const share = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * PERCENT_SCALE)}%` : "0%");
  const totalEndpoints = kpis.endpoints;
  const sourceTotal = data.bySource.reduce((n, s) => n + s.count, 0);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-2">
        {data.latestCheck ? <span>{t("dashboard.updated", { when: when.format(new Date(data.latestCheck)) })}</span> : <span>{t("dashboard.noStatusTitle")}</span>}
        {data.checks > 0 && <span>· {t("dashboard.rounds", { count: data.checks })}</span>}
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <StatTile
          hero
          label={t("dashboard.kpi.availability")}
          note={t("dashboard.kpi.availabilityNote")}
          value={kpis.availability}
          format={(n) => nf.format(Math.round(n * ONE_DECIMAL) / ONE_DECIMAL)}
          unit="%"
          delta={delta(kpis.availabilityDelta, t)}
          spark={trendOf(data.availabilityTrend)}
          footer={<p className="max-w-sm text-caption text-ink-2">{t("dashboard.kpi.availabilityNote")}</p>}
        />
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:gap-x-12">
          <StatTile label={t("dashboard.kpi.apis")} value={kpis.apis} format={count} />
          <StatTile label={t("dashboard.kpi.endpoints")} value={kpis.endpoints} format={count} />
          <StatTile label={t("dashboard.kpi.latency")} note={t("dashboard.kpi.latencyNote")} value={kpis.medianLatencyMs} format={(n) => nf.format(Math.round(n))} unit="ms" spark={trendOf(data.latencyTrend)} sparkColor="var(--series-2)" />
          <StatTile label={t("dashboard.kpi.licenses")} value={kpis.licensesVerified} format={count} footer={<p className="text-caption text-ink-2">{t("dashboard.kpi.ofTotal", { total: kpis.apis })}</p>} />
        </div>
      </section>

      <div className="grid gap-x-12 gap-y-12 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          locale={locale}
          title={t("dashboard.charts.availability.title")}
          question={t("dashboard.charts.availability.question")}
          table={{ headers: [t("dashboard.colTime"), t("dashboard.colValue")], rows: data.availabilityTrend.map((p) => [when.format(new Date(p.t)), pct(p.value)]) }}
        >
          {hasTrend ? (
            <LineChart points={data.availabilityTrend} locale={locale} color="var(--series-1)" fixedMax={PERCENT_SCALE} formatTick={(n) => `${n}%`} formatValue={pct} valueLabel={t("dashboard.kpi.availability")} ariaLabel={t("dashboard.charts.availability.title")} />
          ) : (
            <Collecting count={data.availabilityTrend.length} locale={locale} />
          )}
        </ChartCard>

        <ChartCard
          locale={locale}
          title={t("dashboard.charts.health.title")}
          question={t("dashboard.charts.health.question")}
          table={{ headers: [t("dashboard.colName"), t("dashboard.colValue"), t("dashboard.colShare")], rows: healthSegments.map((s) => [s.label, s.value, share(s.value, totalEndpoints)]) }}
        >
          <SegmentedBar segments={healthSegments} locale={locale} ariaLabel={t("dashboard.charts.health.title")} format={count} />
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          locale={locale}
          title={t("dashboard.charts.latency.title")}
          question={t("dashboard.charts.latency.question")}
          table={{ headers: [t("dashboard.colTime"), t("dashboard.colValue")], rows: data.latencyTrend.map((p) => [when.format(new Date(p.t)), ms(p.value)]) }}
        >
          {data.latencyTrend.length >= 2 ? (
            <LineChart points={data.latencyTrend} locale={locale} color="var(--series-2)" formatTick={(n) => count(n)} formatValue={ms} valueLabel={t("dashboard.kpi.latency")} ariaLabel={t("dashboard.charts.latency.title")} />
          ) : (
            <Collecting count={data.latencyTrend.length} locale={locale} />
          )}
        </ChartCard>

        <ChartCard
          locale={locale}
          title={t("dashboard.charts.source.title")}
          question={t("dashboard.charts.source.question")}
          table={{ headers: [t("dashboard.colName"), t("dashboard.colValue"), t("dashboard.colShare")], rows: data.bySource.map((s) => [t(`source.${s.source}`), s.count, share(s.count, sourceTotal)]) }}
        >
          <DonutChart
            locale={locale}
            centerLabel={t("dashboard.kpi.apis")}
            format={count}
            slices={SOURCES.flatMap((source) => {
              const found = data.bySource.find((s) => s.source === source);
              return found ? [{ key: source, label: t(`source.${source}`), value: found.count, fill: SOURCE_FILL[source], href: explore(QUERY.source, source) }] : [];
            })}
          />
        </ChartCard>

        <ChartCard
          locale={locale}
          title={t("dashboard.charts.category.title")}
          question={t("dashboard.charts.category.question")}
          table={{ headers: [t("dashboard.colName"), t("dashboard.colValue")], rows: data.byCategory.map((c) => [t(`category.${c.category}`), c.count]) }}
        >
          <BarList
            locale={locale}
            format={count}
            items={data.byCategory.map((c) => {
              const Icon = CATEGORY_ICON[c.category];
              return { key: c.category, label: t(`category.${c.category}`), value: c.count, href: explore(QUERY.category, c.category), icon: <Icon aria-hidden size={16} className="shrink-0 text-ink-3" /> };
            })}
          />
        </ChartCard>

        <ChartCard
          locale={locale}
          title={t("dashboard.charts.incidents.title")}
          question={t("dashboard.charts.incidents.question")}
          table={{ headers: [t("dashboard.colName"), t("dashboard.colValue")], rows: data.incidents.map((i) => [names[i.id] ?? i.id, t("dashboard.incidentCount", { bad: i.bad, of: i.of })]) }}
        >
          {data.incidents.length === 0 ? (
            <p className="rounded-md bg-subtle px-3 py-4 text-small text-ink-2">{t("dashboard.noIncidents")}</p>
          ) : (
            <BarList
              locale={locale}
              format={count}
              fill="var(--status-critical)"
              items={data.incidents.map((i) => {
                const Icon = STATUS_ICON[i.status];
                return { key: i.id, label: names[i.id] ?? i.id, value: i.bad, caption: t("dashboard.incidentCount", { bad: i.bad, of: i.of }), href: ROUTES.api(locale, i.id), icon: <Icon aria-hidden size={16} className={`shrink-0 ${STATUS_ICON_CLASS[i.status]}`} /> };
              })}
            />
          )}
        </ChartCard>

        <ChartCard
          locale={locale}
          title={t("dashboard.charts.license.title")}
          question={t("dashboard.charts.license.question")}
          table={{ headers: [t("dashboard.colName"), t("dashboard.colValue"), t("dashboard.colShare")], rows: licenseSegments.map((s) => [s.label, s.value, share(s.value, kpis.apis)]) }}
        >
          <SegmentedBar segments={licenseSegments} locale={locale} ariaLabel={t("dashboard.charts.license.title")} format={count} />
        </ChartCard>
      </div>
    </div>
  );
}
