import { SOURCES, type Locale, type Source, type Status } from "@thai-open-api/schema";
import { CircleHelp, Info, KeyRound, LockOpen } from "lucide-react";
import type { ReactNode } from "react";
import { QUERY, ROUTES, UI } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { DashboardData, Incident } from "../../lib/dashboard.ts";
import { sharePercents } from "../../lib/shares.ts";
import { CATEGORY_ICON } from "../api/categoryIcon.ts";
import { STATUS_FILL, STATUS_ICON, STATUS_ICON_CLASS } from "../api/status.ts";
import { BarList } from "./BarList.tsx";
import { ChartCard } from "./ChartCard.tsx";
import { DonutChart } from "./DonutChart.tsx";
import { CHART_HEIGHT, LineChart } from "./LineChart.tsx";
import { SegmentedBar } from "./SegmentedBar.tsx";
import { StatTile, type Delta } from "./StatTile.tsx";

const SOURCE_FILL: Record<Source, string> = { official: "var(--series-1)", community: "var(--series-2)", unofficial: "var(--series-3)" };
const PERCENT_SCALE = 100;
const ONE_DECIMAL = 10;
/** Statuses that say something about the endpoint itself, healthiest first. The rest are "not checked". */
const CHECKED_STATUSES = ["operational", "degraded", "outage"] as const satisfies readonly Status[];

type T = ReturnType<typeof createT>;

/** `goodWhen` says which direction is good news: availability going up, response time going down. */
const deltaOf = (change: number | null, t: T, key: "delta" | "latencyDelta", goodWhen: "up" | "down"): Delta | null => {
  if (change === null) return null;
  if (change === 0) return { text: t(`dashboard.${key}.flat`), direction: "flat", good: null };
  const direction = change > 0 ? "up" : "down";
  return { text: t(`dashboard.${key}.${direction}`, { n: Math.abs(change) }), direction, good: direction === goodWhen };
};

function Collecting({ count, locale }: { count: number; locale: Locale }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-subtle px-3 py-4 text-small text-ink-2">
      <Info aria-hidden size={16} className="mt-0.5 shrink-0" />
      {createT(locale)("dashboard.collecting", { count, min: UI.minTrendRuns })}
    </p>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-h3 font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

const incidentKinds = (incident: Incident, t: T) =>
  (["outage", "degraded"] as const)
    .filter((kind) => incident[kind] > 0)
    .map((kind) => t(`dashboard.incidentKinds.${kind}`, { n: incident[kind] }))
    .join(" · ");

export function DashboardView({ data, names, locale }: { data: DashboardData; names: Record<string, string>; locale: Locale }) {
  const t = createT(locale);
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const count = (n: number) => nf.format(Math.round(n));
  const oneDecimal = (n: number) => nf.format(Math.round(n * ONE_DECIMAL) / ONE_DECIMAL);
  const pct = (n: number) => t("dashboard.percentValue", { n: oneDecimal(n) });
  const ms = (n: number) => t("common.ms", { n: nf.format(Math.round(n)) });
  const explore = (key: string, value: string) => `${ROUTES.explore(locale)}?${key}=${value}`;
  const { kpis } = data;
  // dateStyle/timeStyle cannot be combined with timeZoneName, so the fields are spelled out.
  const updated = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  // Two checks inside one minute must stay tellable apart in the table, so tables carry seconds.
  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" });
  const trendOf = (points: { value: number }[]) => points.map((p) => p.value);
  const enough = (points: unknown[]) => points.length >= UI.minTrendRuns;

  const availabilityValues = trendOf(data.availabilityTrend);
  const steady = enough(availabilityValues) && availabilityValues.every((v) => v === availabilityValues[0]);

  const checked = CHECKED_STATUSES.map((status) => ({
    key: status,
    label: t(`status.${status}`),
    value: data.endpointHealth[status],
    ...STATUS_FILL[status],
    icon: STATUS_ICON[status],
    href: explore(QUERY.status, status),
  }));
  const healthSegments = [
    ...checked,
    // Key-gated and never-probed endpoints say nothing about health, so they share one quiet bucket.
    { key: "unchecked", label: t("dashboard.health.unchecked"), value: data.endpointHealth.unknown + data.endpointHealth.auth_required, ...STATUS_FILL.unknown, icon: CircleHelp, href: undefined },
  ];
  const accessSegments = [
    { key: "none", label: t("dashboard.access.none"), value: data.access.open, fill: "var(--series-other)", ink: "var(--on-series-other)", icon: LockOpen, href: explore(QUERY.auth, "none") },
    { key: "apiKey", label: t("dashboard.access.apiKey"), value: data.access.apiKey, ...STATUS_FILL.auth_required, icon: KeyRound, href: explore(QUERY.auth, "apiKey") },
  ];
  const licenseSegments = [
    { key: "verified", label: t("dashboard.licenseStates.verified"), value: data.license.verified, fill: "var(--series-1)", ink: "var(--on-series-1)" },
    { key: "declared", label: t("dashboard.licenseStates.declared"), value: data.license.declared, fill: "var(--series-1-light)", ink: "var(--on-series-1-light)" },
    { key: "unknown", label: t("dashboard.licenseStates.unknown"), value: data.license.unknown, fill: "var(--series-other)", ink: "var(--on-series-other)" },
  ];
  const tableRows = (segments: { label: string; value: number }[]) => {
    const shares = sharePercents(segments.map((s) => s.value));
    return segments.map((s, i) => [s.label, s.value, `${shares[i]}%`]);
  };
  const shareHeaders = [t("dashboard.colName"), t("dashboard.colValue"), t("dashboard.colShare")];
  const sourceSlices = SOURCES.flatMap((source) => {
    const found = data.bySource.find((s) => s.source === source);
    return found ? [{ key: source, label: t(`source.${source}`), value: found.count, fill: SOURCE_FILL[source], href: explore(QUERY.source, source) }] : [];
  });
  const endpointsPerApi = kpis.apis > 0 ? oneDecimal(kpis.endpoints / kpis.apis) : null;
  const availabilityOf = kpis.availabilityOf;

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-1 text-small text-ink-2">
        {data.latestCheck ? <p>{t("dashboard.updated", { when: updated.format(new Date(data.latestCheck)) })}</p> : <p>{t("dashboard.noStatusTitle")}</p>}
        <p>
          {data.checks > 0 && `${t("dashboard.rounds", { count: data.checks })} · `}
          {t("dashboard.cadence", { hours: UI.probeEveryHours })}
        </p>
      </div>

      <Section title={t("dashboard.sections.overview")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <StatTile
            hero
            label={t("dashboard.kpi.availability")}
            note={availabilityOf ? t("dashboard.kpi.availabilityCount", { up: availabilityOf.up, total: availabilityOf.total }) : undefined}
            value={kpis.availability}
            format={oneDecimal}
            unit="%"
            delta={deltaOf(kpis.availabilityDelta, t, "delta", "up")}
            spark={availabilityValues}
            footer={<p className="max-w-sm text-caption text-ink-2">{t("dashboard.kpi.availabilityScope")}</p>}
          />
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:gap-x-12">
            <StatTile label={t("dashboard.kpi.apis")} value={kpis.apis} format={count} note={t("dashboard.kpi.ofTotal", { total: kpis.apis })} />
            <StatTile label={t("dashboard.kpi.endpoints")} value={kpis.endpoints} format={count} note={endpointsPerApi === null ? undefined : t("dashboard.kpi.endpointsPerApi", { n: endpointsPerApi })} />
            <StatTile
              label={t("dashboard.kpi.latency")}
              note={kpis.medianLatencyMs === null ? undefined : t("dashboard.kpi.latencyNote", { n: kpis.latencySamples })}
              value={kpis.medianLatencyMs}
              format={count}
              unit="ms"
              delta={deltaOf(kpis.latencyDelta, t, "latencyDelta", "down")}
              spark={trendOf(data.latencyTrend)}
              sparkColor="var(--series-2)"
            />
            <StatTile label={t("dashboard.kpi.licenses")} value={kpis.licensesVerified} format={count} note={t("dashboard.kpi.ofTotal", { total: kpis.apis })} />
          </div>
        </div>
      </Section>

      <Section title={t("dashboard.sections.health")}>
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-10">
            <ChartCard
              locale={locale}
              title={t("dashboard.charts.availability.title")}
              question={t("dashboard.charts.availability.question")}
              table={{ headers: [t("dashboard.colTime"), t("dashboard.colValue")], rows: data.availabilityTrend.map((p) => [exact.format(new Date(p.t)), pct(p.value)]) }}
            >
              {enough(data.availabilityTrend) ? (
                <div className="flex flex-col gap-2">
                  {steady && <p className="text-small text-ink-2">{t("dashboard.steady", { value: pct(availabilityValues[0]), count: availabilityValues.length })}</p>}
                  <LineChart points={data.availabilityTrend} locale={locale} color="var(--series-1)" fixedMax={PERCENT_SCALE} height={steady ? CHART_HEIGHT.compact : CHART_HEIGHT.regular} formatTick={(n) => `${n}%`} formatValue={pct} valueLabel={t("dashboard.kpi.availability")} ariaLabel={t("dashboard.charts.availability.title")} />
                </div>
              ) : (
                <Collecting count={data.availabilityTrend.length} locale={locale} />
              )}
            </ChartCard>

            <ChartCard
              locale={locale}
              title={t("dashboard.charts.latency.title")}
              question={t("dashboard.charts.latency.question")}
              table={{ headers: [t("dashboard.colTime"), t("dashboard.colValue")], rows: data.latencyTrend.map((p) => [exact.format(new Date(p.t)), ms(p.value)]) }}
            >
              {enough(data.latencyTrend) ? (
                <LineChart points={data.latencyTrend} locale={locale} color="var(--series-2)" formatTick={count} formatValue={ms} valueLabel={t("dashboard.kpi.latency")} ariaLabel={t("dashboard.charts.latency.title")} />
              ) : (
                <Collecting count={data.latencyTrend.length} locale={locale} />
              )}
            </ChartCard>
          </div>

          <div className="flex min-w-0 flex-col gap-10">
            <ChartCard locale={locale} title={t("dashboard.charts.health.title")} question={t("dashboard.charts.health.question")} table={{ headers: shareHeaders, rows: tableRows(healthSegments) }}>
              <div className="flex flex-col gap-3">
                <SegmentedBar segments={healthSegments} locale={locale} ariaLabel={t("dashboard.charts.health.title")} format={count} />
                <p className="text-caption text-ink-2">{t("dashboard.health.uncheckedHint")}</p>
              </div>
            </ChartCard>

            <ChartCard locale={locale} title={t("dashboard.charts.access.title")} question={t("dashboard.charts.access.question")} table={{ headers: shareHeaders, rows: tableRows(accessSegments) }}>
              <SegmentedBar segments={accessSegments} locale={locale} ariaLabel={t("dashboard.charts.access.title")} format={count} />
            </ChartCard>

            <ChartCard
              locale={locale}
              title={t("dashboard.charts.incidents.title")}
              question={t("dashboard.charts.incidents.question")}
              table={{
                headers: [t("dashboard.colName"), t("dashboard.colProblem"), t("dashboard.colValue")],
                rows: data.incidents.map((i) => [names[i.id] ?? i.id, incidentKinds(i, t), t("dashboard.incidentCount", { bad: i.bad, of: i.of })]),
              }}
            >
              {data.incidents.length === 0 ? (
                <p className="rounded-md bg-subtle px-3 py-4 text-small text-ink-2">{t("dashboard.noIncidents")}</p>
              ) : (
                <BarList
                  locale={locale}
                  format={count}
                  valueWidth="5.5rem"
                  items={data.incidents.map((i) => {
                    const Icon = STATUS_ICON[i.status];
                    return {
                      key: i.id,
                      label: names[i.id] ?? i.id,
                      value: i.bad,
                      valueText: t("dashboard.incidentCount", { bad: i.bad, of: i.of }),
                      caption: incidentKinds(i, t),
                      // Red when it went down at all, amber when it was only slow.
                      fill: i.outage > 0 ? STATUS_FILL.outage.fill : STATUS_FILL.degraded.fill,
                      href: ROUTES.api(locale, i.id),
                      icon: <Icon aria-hidden size={16} className={`shrink-0 ${STATUS_ICON_CLASS[i.status]}`} />,
                    };
                  })}
                />
              )}
            </ChartCard>
          </div>
        </div>
      </Section>

      <Section title={t("dashboard.sections.catalog")}>
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard locale={locale} title={t("dashboard.charts.category.title")} question={t("dashboard.charts.category.question")} table={{ headers: [t("dashboard.colName"), t("dashboard.colValue")], rows: data.byCategory.map((c) => [t(`category.${c.category}`), c.count]) }}>
            <BarList
              locale={locale}
              format={count}
              valueWidth="4.5rem"
              items={data.byCategory.map((c) => {
                const Icon = CATEGORY_ICON[c.category];
                return { key: c.category, label: t(`category.${c.category}`), value: c.count, valueText: t("dashboard.unitApis", { n: c.count }), href: explore(QUERY.category, c.category), icon: <Icon aria-hidden size={16} className="shrink-0 text-ink-3" /> };
              })}
            />
          </ChartCard>

          <ChartCard locale={locale} title={t("dashboard.charts.source.title")} question={t("dashboard.charts.source.question")} table={{ headers: shareHeaders, rows: tableRows(sourceSlices) }}>
            <DonutChart locale={locale} centerLabel={t("dashboard.kpi.apis")} format={count} slices={sourceSlices} />
          </ChartCard>

          <ChartCard className="md:col-span-2 xl:col-span-1" locale={locale} title={t("dashboard.charts.license.title")} question={t("dashboard.charts.license.question")} table={{ headers: shareHeaders, rows: tableRows(licenseSegments) }}>
            <div className="flex flex-col gap-3">
              <p className="text-small text-ink-2">{t("dashboard.licenseProgress", { verified: data.license.verified, total: kpis.apis })}</p>
              <SegmentedBar segments={licenseSegments} locale={locale} ariaLabel={t("dashboard.charts.license.title")} format={count} />
            </div>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}
