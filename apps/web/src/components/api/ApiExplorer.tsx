import { AUTH_TYPES, CATEGORIES, SOURCES, type AuthType, type Category, type Locale, type Source, type Status } from "@thai-open-api/schema";
import { ChevronDown, KeyRound, LockOpen, Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SORTS, UI } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import {
  STATUS_FACET_VALUES,
  activeFacets,
  applyFilters,
  effectiveDir,
  effectiveSort,
  emptyReason,
  facetCounts,
  nextSort,
  parseFilters,
  serializeFilters,
  type Facet,
  type Filters,
} from "../../lib/filters.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { Button } from "../ui/Button.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";
import { Field, Input } from "../ui/Field.tsx";
import { Listbox } from "../ui/Listbox.tsx";
import { ApiTable } from "./ApiTable.tsx";
import { CATEGORY_ICON } from "./categoryIcon.ts";
import { FacetOption } from "./FacetOption.tsx";
import { IconLegend } from "./IconLegend.tsx";
import { STATUS_ICON, STATUS_ICON_CLASS } from "./status.ts";
import { SOURCE_ICON } from "./TrustBadge.tsx";

const FACET_VALUES: Record<Facet, readonly string[]> = { category: CATEGORIES, source: SOURCES, auth: AUTH_TYPES, status: STATUS_FACET_VALUES };
const FACETS = Object.keys(FACET_VALUES) as Facet[];

/** The icon (and colour) that stands for a filter value, so the list reads without relying on words alone. */
function facetIcon(facet: Facet, value: string): { icon: LucideIcon; className?: string } {
  if (facet === "category") return { icon: CATEGORY_ICON[value as Category] };
  if (facet === "source") return { icon: SOURCE_ICON[value as Source] };
  if (facet === "auth") return { icon: (value as AuthType) === "apiKey" ? KeyRound : LockOpen };
  return { icon: STATUS_ICON[value as Status], className: STATUS_ICON_CLASS[value as Status] };
}

/** Client-only: it reads the URL on its very first render, so a filtered link never flashes the full list. */
export function ApiExplorer({ apis, locale }: { apis: ApiSummary[]; locale: Locale }) {
  const t = createT(locale);
  const [filters, setFilters] = useState<Filters>(() => parseFilters(new URLSearchParams(window.location.search)));
  const [draft, setDraft] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);

  // The URL stays the single source of truth, so back from a detail page restores the same view.
  useEffect(() => {
    const query = serializeFilters(filters).toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.q === draft.trim() ? f : { ...f, q: draft.trim() })), UI.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [draft]);

  const results = useMemo(() => applyFilters(apis, filters, locale), [apis, filters, locale]);
  const active = activeFacets(filters);
  const reason = emptyReason(filters);
  const setFacet = (facet: Facet, value: string | undefined) => setFilters((f) => ({ ...f, [facet]: f[facet] === value ? undefined : value }));
  const clearQuery = () => {
    setDraft("");
    setFilters((f) => ({ ...f, q: "" }));
  };
  const clearFacets = () => setFilters((f) => ({ q: f.q, sort: f.sort }));
  const clearAll = () => {
    setDraft("");
    setFilters((f) => ({ q: "", sort: f.sort }));
  };
  const labelOf = (facet: Facet, value: string) => t(`${facet}.${value}` as never);
  const facetNames = active.map((f) => labelOf(f, filters[f] as string)).join(", ");
  const sort = effectiveSort(filters);
  const dir = effectiveDir(filters);
  // Typing a query silently switches the sort to relevance, so the screen reader is told, not just the eye.
  const sortName = sort === "relevance" ? t("explorer.sortOptions.relevance") : t(`explorer.sortDescribe.${sort}.${dir ?? "asc"}`);
  const announcement = `${t("explorer.results", { count: results.length })} · ${t("explorer.sortedBy", { sort: sortName })}`;

  const emptyBody =
    reason === "both" ? t("explorer.emptyQueryIn", { query: filters.q, filters: facetNames })
    : reason === "query" ? t("explorer.emptyQuery", { query: filters.q })
    : reason === "facets" ? t("explorer.emptyWithFilters", { filters: facetNames })
    : t("explorer.emptyBody");

  const filterPanel = (
    <div className="flex flex-col">
      {FACETS.map((facet) => {
        const counts = facetCounts(apis, filters, facet, locale);
        return (
          <details key={facet} open className="group/facet border-t border-line py-3 first:border-t-0 first:pt-0">
            <summary className="mb-1 flex min-h-9 cursor-pointer list-none items-center justify-between rounded-md px-2 text-small font-semibold text-ink transition-colors duration-150 hover:bg-subtle [&::-webkit-details-marker]:hidden">
              {t(`explorer.facets.${facet}`)}
              <ChevronDown aria-hidden size={16} className="text-ink-3 transition-transform duration-200 group-open/facet:rotate-180" />
            </summary>
            <div className="flex flex-col gap-0.5">
              {FACET_VALUES[facet].map((value) => {
                const { icon, className } = facetIcon(facet, value);
                const count = counts[value] ?? 0;
                return (
                  <FacetOption key={value} label={labelOf(facet, value)} count={count} countLabel={t("explorer.countLabel", { count })} selected={filters[facet] === value} onToggle={() => setFacet(facet, value)} icon={icon} iconClass={className} />
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );

  const resultCount = <p aria-hidden className="text-small font-medium text-ink">{t("explorer.results", { count: results.length })}</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height)-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1" aria-label={t("explorer.filters")}>
        <a href="#results" className="sr-only rounded-md bg-fill px-3 py-2 text-small text-on-brand focus:not-sr-only focus:mb-3 focus:inline-block">
          {t("explorer.skipToResults")}
        </a>
        <Button variant="secondary" className="w-full lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)} icon={<SlidersHorizontal aria-hidden size={16} />}>
          {showFilters ? t("explorer.hideFilters") : t("explorer.showFilters")}
          {active.length > 0 && ` (${active.length})`}
        </Button>
        <div className={`${showFilters ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>
          {active.length > 0 && (
            <Button variant="ghost" className="mb-2 h-8 px-2 text-caption" onClick={clearFacets} icon={<X aria-hidden size={13} />}>
              {t("explorer.clear")} ({active.length})
            </Button>
          )}
          {filterPanel}
        </div>
      </aside>

      <section className="min-w-0">
        <p className="sr-only" role="status">{announcement}</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <Field label={t("explorer.searchLabel")} htmlFor="explorer-search">
            <div className="relative">
              <Search aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <Input id="explorer-search" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("explorer.searchPlaceholder")} className="pl-9" />
            </div>
          </Field>
          <Field label={t("explorer.sort")} htmlFor="explorer-sort">
            <Listbox
              id="explorer-sort"
              value={sort}
              options={SORTS.filter((o) => o !== "relevance" || filters.q).map((o) => ({ value: o, label: t(`explorer.sortOptions.${o}`) }))}
              onChange={(next) => setFilters((f) => ({ ...f, sort: next as Filters["sort"], dir: undefined }))}
            />
          </Field>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* With results the count sits on the legend line below; with none there is no legend, so it stays here. */}
          {results.length === 0 && resultCount}
          {filters.q && (
            <button type="button" onClick={clearQuery} aria-label={t("explorer.clearQuery")} className="chip-filter">
              {t("explorer.queryChip", { query: filters.q })}
              <X aria-hidden size={13} />
            </button>
          )}
          {active.map((facet) => (
            <button key={facet} type="button" onClick={() => setFacet(facet, filters[facet])} aria-label={t("explorer.clearOne", { name: labelOf(facet, filters[facet] as string) })} className="chip-filter">
              {labelOf(facet, filters[facet] as string)}
              <X aria-hidden size={13} />
            </button>
          ))}
          {reason !== null && (
            <Button variant="ghost" className="h-8 px-2 text-caption" onClick={clearAll}>
              {t("explorer.clearAll")}
            </Button>
          )}
        </div>

        <div id="results" tabIndex={-1} className="outline-none">
          {results.length === 0 ? (
            <EmptyState
              icon={<Search aria-hidden size={28} />}
              title={t("explorer.emptyTitle")}
              action={
                reason !== null && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {filters.q && <Button variant="secondary" onClick={clearQuery}>{t("explorer.clearQuery")}</Button>}
                    {active.length > 0 && <Button variant="secondary" onClick={clearFacets}>{t("explorer.clear")}</Button>}
                    {reason === "both" && <Button onClick={clearAll}>{t("explorer.clearAll")}</Button>}
                  </div>
                )
              }
            >
              {emptyBody}
            </EmptyState>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                {resultCount}
                <IconLegend kinds={["source", "auth", "license"]} locale={locale} />
              </div>
              <ApiTable apis={results} locale={locale} sort={sort} dir={dir} onSort={(column) => setFilters((f) => ({ ...f, ...nextSort(f, column) }))} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
