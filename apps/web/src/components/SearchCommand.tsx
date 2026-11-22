import type { Locale } from "@thai-open-api/schema";
import { Clock, CornerDownLeft, History, Search, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HOTKEY, HOTKEY_LABEL, QUERY, ROUTES, STORAGE, UI } from "../config/site.ts";
import { createT } from "../i18n/index.ts";
import { searchApis } from "../lib/search.ts";
import type { ApiSummary } from "../lib/summary.ts";
import { StatusBadge } from "./api/StatusBadge.tsx";
import { Skeleton } from "./ui/Skeleton.tsx";
import { cx } from "./ui/cx.ts";

type Load = { state: "idle" } | { state: "loading" } | { state: "error" } | { state: "ready"; apis: ApiSummary[] };
/** One selectable line: an API to open, or a past search to run again. */
type Entry = { kind: "api"; api: ApiSummary } | { kind: "query"; text: string };
interface Group {
  key: string;
  label: string | null;
  icon?: typeof Clock;
  items: Entry[];
}

const stringList = (raw: string | null): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};
const MIN_REMEMBERED_QUERY = 2;

/** Last few APIs the visitor opened. Local to this browser; never sent anywhere. */
function readRecent(key: string): string[] {
  try {
    return stringList(window.localStorage.getItem(key));
  } catch {
    return [];
  }
}
function remember(key: string, value: string, keep: number) {
  try {
    window.localStorage.setItem(key, JSON.stringify([value, ...readRecent(key).filter((x) => x !== value)].slice(0, keep)));
  } catch {
    /* storage blocked: recents are a convenience, not a feature that must work */
  }
}
const rememberApi = (id: string) => remember(STORAGE.recentApis, id, UI.recentApisKept);
const rememberQuery = (text: string) => text.trim().length >= MIN_REMEMBERED_QUERY && remember(STORAGE.recentQueries, text.trim(), UI.recentQueriesKept);

/** Cmd/Ctrl K palette. Results update as you type; with an empty box it offers recent and suggested APIs. */
export function SearchCommand({ locale }: { locale: Locale }) {
  const t = createT(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [hotkey, setHotkey] = useState<string>(HOTKEY_LABEL.other);
  useEffect(() => setHotkey(/Mac|iPhone|iPad/.test(navigator.userAgent) ? HOTKEY_LABEL.mac : HOTKEY_LABEL.other), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === HOTKEY && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) {
      setRecentIds(readRecent(STORAGE.recentApis));
      setRecentQueries(readRecent(STORAGE.recentQueries));
      input.current?.focus();
      input.current?.select(); // reopening keeps the last query selected, so typing replaces it
    }
  }, [open]);

  useEffect(() => {
    if (!open || load.state !== "idle") return;
    setLoad({ state: "loading" });
    fetch(ROUTES.searchIndex(locale))
      .then((res) => (res.ok ? (res.json() as Promise<ApiSummary[]>) : Promise.reject(new Error(String(res.status)))))
      .then((apis) => setLoad({ state: "ready", apis }))
      .catch(() => setLoad({ state: "error" }));
  }, [open, load.state, locale]);

  const groups = useMemo<Group[]>(() => {
    if (load.state !== "ready") return [];
    const asApis = (apis: ApiSummary[]): Entry[] => apis.map((api) => ({ kind: "api", api }));
    if (query.trim()) return [{ key: "results", label: null, items: asApis(searchApis(load.apis, query, locale).slice(0, UI.searchResultLimit)) }];
    const byId = new Map(load.apis.map((a) => [a.id, a]));
    const recent = recentIds.flatMap((id) => (byId.has(id) ? [byId.get(id) as ApiSummary] : []));
    const taken = new Set(recent.map((a) => a.id));
    const suggested = [...load.apis].sort((a, b) => b.trustScore - a.trustScore).filter((a) => !taken.has(a.id)).slice(0, UI.suggestedApis);
    return [
      { key: "queries", label: t("search.recentQueries"), icon: History, items: recentQueries.map((text): Entry => ({ kind: "query", text })) },
      { key: "recent", label: t("search.recent"), icon: Clock, items: asApis(recent) },
      { key: "suggested", label: t("search.suggested"), icon: Sparkles, items: asApis(suggested) },
    ].filter((g) => g.items.length > 0);
  }, [load, query, recentIds, recentQueries, locale, t]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  useEffect(() => setCursor(0), [query]);

  const go = (api: ApiSummary) => {
    rememberApi(api.id);
    rememberQuery(query);
    window.location.assign(ROUTES.api(locale, api.id));
  };
  const choose = (entry: Entry) => {
    if (entry.kind === "api") return go(entry.api);
    setQuery(entry.text);
    input.current?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") setCursor((c) => Math.min(c + 1, flat.length - 1));
    else if (event.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
    else if (event.key === "Enter" && flat[cursor]) choose(flat[cursor]);
    else return;
    event.preventDefault();
  };

  let index = -1;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-control bg-surface px-3 text-small text-ink-2 transition-colors duration-150 hover:bg-subtle"
      >
        <Search aria-hidden size={16} />
        <span className="hidden sm:inline">{t("search.open")}</span>
        <kbd className="hidden rounded border border-line bg-subtle px-1.5 text-caption sm:inline">{hotkey}</kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label={t("search.title")}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        className="mx-auto mt-[12vh] w-[min(92vw,38rem)] overflow-hidden rounded-xl border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-brand-900/40"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search aria-hidden size={18} className="text-ink-3" />
          <input
            ref={input}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={flat[cursor] ? `${listId}-${cursor}` : undefined}
            aria-label={t("search.title")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            className="h-14 w-full bg-transparent text-body outline-none placeholder:text-ink-3"
          />
        </div>
        <div id={listId} role="listbox" aria-label={t("search.title")} className="max-h-[50vh] overflow-y-auto p-2">
          {load.state === "loading" && (
            <div role="status" aria-label={t("search.loading")} className="flex flex-col gap-2 p-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}
            </div>
          )}
          {load.state === "error" && <p className="px-3 py-6 text-center text-small text-error-fg">{t("search.error")}</p>}
          {load.state === "ready" && flat.length === 0 && query && <p className="px-3 py-6 text-center text-small text-ink-2">{t("search.noResults", { query })}</p>}
          {groups.map((group) => (
            <div key={group.key} role="group" aria-label={group.label ?? undefined}>
              {group.label && (
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-ink-2">
                  {group.icon && <group.icon aria-hidden size={13} />}
                  {group.label}
                </p>
              )}
              {group.items.map((entry) => {
                index += 1;
                const mine = index;
                const tone = cx("flex items-center justify-between gap-3 rounded-md px-3 py-2.5", mine === cursor ? "bg-brand-100" : "hover:bg-subtle");
                return (
                  <div key={entry.kind === "api" ? entry.api.id : `q-${entry.text}`} id={`${listId}-${mine}`} role="option" aria-selected={mine === cursor}>
                    {entry.kind === "api" ? (
                      <a href={ROUTES.api(locale, entry.api.id)} onClick={() => { rememberApi(entry.api.id); rememberQuery(query); }} onMouseEnter={() => setCursor(mine)} className={tone}>
                        <span className="min-w-0">
                          <span className="block truncate text-small font-medium">{entry.api.name}</span>
                          <span className="block truncate text-caption text-ink-2">{entry.api.provider} · {entry.api.categoryLabel}</span>
                        </span>
                        <StatusBadge status={entry.api.status} locale={locale} />
                      </a>
                    ) : (
                      <button type="button" onClick={() => choose(entry)} onMouseEnter={() => setCursor(mine)} className={cx(tone, "w-full text-left text-small")}>
                        <span className="truncate">{entry.text}</span>
                        <CornerDownLeft aria-hidden size={14} className="shrink-0 text-ink-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle px-4 py-2 text-caption text-ink-2">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft aria-hidden size={13} />
            {t("search.hint")}
          </span>
          {query && (
            <a className="text-link hover:underline" onClick={() => rememberQuery(query)} href={`${ROUTES.explore(locale)}?${QUERY.search}=${encodeURIComponent(query)}`}>
              {t("search.viewAll")}
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}
