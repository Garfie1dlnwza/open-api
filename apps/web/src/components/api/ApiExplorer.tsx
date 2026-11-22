import { AUTH_TYPES, CATEGORIES, SOURCES, STATUSES, type Category, type Locale } from "@thai-open-api/schema";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SORTS, UI } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import { activeFacets, applyFilters, effectiveSort, facetCounts, parseFilters, serializeFilters, type Facet, type Filters } from "../../lib/filters.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { Button } from "../ui/Button.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";
import { Field, Input, Select } from "../ui/Field.tsx";
import { ApiCard } from "./ApiCard.tsx";
import { CategoryChip } from "./CategoryChip.tsx";

const FACET_VALUES: Record<Facet, readonly string[]> = { category: CATEGORIES, source: SOURCES, auth: AUTH_TYPES, status: STATUSES };

export function ApiExplorer({ apis, locale }: { apis: ApiSummary[]; locale: Locale }) {
  const t = createT(locale);
  const [filters, setFilters] = useState<Filters>({ q: "" });
  const [draft, setDraft] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // The URL is the single source of truth, so back from a detail page restores the same view.
  useEffect(() => {
    const initial = parseFilters(new URLSearchParams(window.location.search));
    setFilters(initial);
    setDraft(initial.q);
  }, []);

  useEffect(() => {
    const query = serializeFilters(filters).toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.q === draft ? f : { ...f, q: draft.trim() })), UI.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [draft]);

  const results = useMemo(() => applyFilters(apis, filters), [apis, filters]);
  const active = activeFacets(filters);
  const hasAnyFilter = active.length > 0 || filters.q !== "";
  const setFacet = (facet: Facet, value: string | undefined) => setFilters((f) => ({ ...f, [facet]: f[facet] === value ? undefined : value }));
  const clearAll = () => {
    setFilters({ q: "", sort: filters.sort });
    setDraft("");
  };
  const labelOf = (facet: Facet, value: string) => t(`${facet === "auth" ? "auth" : facet}.${value}` as never);
  const sort = effectiveSort(filters);

  const filterPanel = (
    <div className="flex flex-col gap-6">
      {(Object.keys(FACET_VALUES) as Facet[]).map((facet) => {
        const counts = facetCounts(apis, filters, facet);
        return (
          <fieldset key={facet} className="flex flex-col gap-2">
            <legend className="mb-1 text-small font-semibold">{t(`explorer.facets.${facet}`)}</legend>
            <div className="flex flex-wrap gap-2">
              {FACET_VALUES[facet].map((value) => (
                <CategoryChip key={value} label={labelOf(facet, value)} count={counts[value] ?? 0} selected={filters[facet] === value} onToggle={() => setFacet(facet, value)} category={facet === "category" ? (value as Category) : undefined} />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start" aria-label={t("explorer.filters")}>
        <Button variant="secondary" className="w-full lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)} icon={<SlidersHorizontal aria-hidden size={16} />}>
          {showFilters ? t("explorer.hideFilters") : t("explorer.showFilters")}
          {active.length > 0 && ` (${active.length})`}
        </Button>
        <div className={`${showFilters ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>{filterPanel}</div>
      </aside>

      <section aria-live="polite" className="min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Field label={t("explorer.searchLabel")} htmlFor="explorer-search">
            <div className="relative">
              <Search aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <Input id="explorer-search" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("explorer.searchPlaceholder")} className="pl-9" />
            </div>
          </Field>
          <Field label={t("explorer.sort")} htmlFor="explorer-sort">
            <Select id="explorer-sort" value={sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as Filters["sort"] }))}>
              {SORTS.filter((s) => s !== "relevance" || filters.q).map((s) => (
                <option key={s} value={s}>
                  {t(`explorer.sortOptions.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-small text-ink-2">{t("explorer.results", { count: results.length })}</p>
          {active.map((facet) => (
            <button
              key={facet}
              type="button"
              onClick={() => setFacet(facet, filters[facet])}
              aria-label={t("explorer.clearOne", { name: labelOf(facet, filters[facet] as string) })}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-100 px-3 text-caption font-medium text-brand-800 transition-colors duration-150 hover:bg-line"
            >
              {labelOf(facet, filters[facet] as string)}
              <X aria-hidden size={13} />
            </button>
          ))}
          {hasAnyFilter && (
            <Button variant="ghost" className="h-8 px-2 text-caption" onClick={clearAll}>
              {t("explorer.clear")}
            </Button>
          )}
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={<Search aria-hidden size={28} />}
            title={t("explorer.emptyTitle")}
            action={
              hasAnyFilter && (
                <Button variant="secondary" onClick={clearAll}>
                  {t("explorer.clear")}
                </Button>
              )
            }
          >
            {active.length > 0 ? t("explorer.emptyWithFilters", { filters: active.map((f) => labelOf(f, filters[f] as string)).join(", ") }) : t("explorer.emptyBody")}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {results.map((api) => (
              <li key={api.id} className="flex">
                <div className="flex w-full flex-col">
                  <ApiCard api={api} locale={locale} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
