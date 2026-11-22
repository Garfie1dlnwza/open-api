import type { Locale } from "@thai-open-api/schema";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HOTKEY, HOTKEY_LABEL, QUERY, ROUTES, UI } from "../config/site.ts";
import { createT } from "../i18n/index.ts";
import { searchApis } from "../lib/search.ts";
import type { ApiSummary } from "../lib/summary.ts";
import { StatusBadge } from "./api/StatusBadge.tsx";
import { Skeleton } from "./ui/Skeleton.tsx";
import { cx } from "./ui/cx.ts";

type Load = { state: "idle" } | { state: "loading" } | { state: "error" } | { state: "ready"; apis: ApiSummary[] };

/** ⌘K palette. The index is fetched on first open so it never weighs on page load. */
export function SearchCommand({ locale }: { locale: Locale }) {
  const t = createT(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "idle" });
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

  const results = useMemo(() => (load.state === "ready" ? searchApis(load.apis, query, locale).slice(0, UI.searchResultLimit) : []), [load, query, locale]);
  useEffect(() => setCursor(0), [query]);

  const go = (api: ApiSummary) => {
    window.location.assign(ROUTES.api(locale, api.id));
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
    else if (event.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
    else if (event.key === "Enter" && results[cursor]) go(results[cursor]);
    else return;
    event.preventDefault();
  };

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
            aria-activedescendant={results[cursor] ? `${listId}-${results[cursor].id}` : undefined}
            aria-label={t("search.title")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            className="h-14 w-full bg-transparent text-body outline-none placeholder:text-ink-3"
          />
        </div>
        <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {load.state === "loading" && (
            <li role="status" aria-label={t("search.loading")} className="flex flex-col gap-2 p-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}
            </li>
          )}
          {load.state === "error" && <li className="px-3 py-6 text-center text-small text-error-fg">{t("search.error")}</li>}
          {load.state === "ready" && results.length === 0 && query && <li className="px-3 py-6 text-center text-small text-ink-2">{t("search.noResults", { query })}</li>}
          {results.map((api, i) => (
            <li key={api.id} id={`${listId}-${api.id}`} role="option" aria-selected={i === cursor}>
              <a
                href={ROUTES.api(locale, api.id)}
                onMouseEnter={() => setCursor(i)}
                className={cx("flex items-center justify-between gap-3 rounded-md px-3 py-2.5", i === cursor ? "bg-brand-100" : "hover:bg-subtle")}
              >
                <span className="min-w-0">
                  <span className="block truncate text-small font-medium">{api.name}</span>
                  <span className="block truncate text-caption text-ink-2">{api.provider} · {api.categoryLabel}</span>
                </span>
                <StatusBadge status={api.status} locale={locale} />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle px-4 py-2 text-caption text-ink-2">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft aria-hidden size={13} />
            {t("search.hint")}
          </span>
          {query && (
            <a className="text-brand-700 hover:underline" href={`${ROUTES.explore(locale)}?${QUERY.search}=${encodeURIComponent(query)}`}>
              {t("search.viewAll")}
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}
