import type { Locale } from "@thai-open-api/schema";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { ROUTES, type Direction, type Sort } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { cx } from "../ui/cx.ts";
import { ApiLicenseIcon, ApiReviewed, ApiSourceIcons } from "./ApiCells.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type SortColumn = Exclude<Sort, "relevance">;
type ColumnId = "status" | "api" | "description" | "source" | "license" | "trust" | "reviewed";

interface Column {
  id: ColumnId;
  /** Column sorts by this when its header is clicked. */
  sort?: SortColumn;
  /** Responsive visibility and width. Narrow screens drop columns, never squeeze them. */
  className: string;
}

/** Which columns show where: the API cell carries its description below xl, so nothing is lost when one is hidden. */
const COLUMNS: Column[] = [
  { id: "status", className: "w-16 pl-4 pr-2" },
  { id: "api", sort: "name", className: "px-2" },
  { id: "description", className: "hidden px-2 xl:table-cell" },
  { id: "source", className: "w-24 px-2" },
  { id: "license", className: "hidden w-20 px-2 md:table-cell" },
  { id: "trust", sort: "trust", className: "hidden w-32 px-2 lg:table-cell" },
  { id: "reviewed", sort: "verified", className: "hidden w-28 pl-2 pr-4 md:table-cell" },
];

const LEVEL_DOT = { high: "bg-success-dot", medium: "bg-warning-dot", low: "bg-error-dot" } as const;

/** A real table: column headers that sort, rows that open the API, and a header that stays in view while you scroll. */
export function ApiTable({ apis, locale, sort, dir, onSort }: { apis: ApiSummary[]; locale: Locale; sort: Sort; dir: Direction | null; onSort: (column: SortColumn) => void }) {
  const t = createT(locale);
  const label = (id: ColumnId) => t(`explorer.columns.${id}`);

  const header = (column: Column): ReactNode => {
    const sorted = column.sort !== undefined && sort === column.sort;
    const Arrow = sorted ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    const text = label(column.id);
    return (
      <th
        key={column.id}
        scope="col"
        aria-sort={sorted ? (dir === "asc" ? "ascending" : "descending") : undefined}
        className={cx(
          "sticky top-[var(--header-height)] z-10 whitespace-nowrap border-b-2 border-line-strong bg-subtle py-3 text-left text-small font-semibold text-ink first:rounded-tl-lg last:rounded-tr-lg",
          column.className,
        )}
      >
        {column.sort ? (
          <button
            type="button"
            onClick={() => onSort(column.sort as SortColumn)}
            aria-label={t("explorer.sortColumn", { column: text })}
            className={cx("group/sort -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-150 hover:bg-line hover:text-link", sorted && "text-link")}
          >
            {text}
            <Arrow aria-hidden size={14} className={cx("transition-opacity duration-150", !sorted && "opacity-40 group-hover/sort:opacity-100")} />
          </button>
        ) : (
          text
        )}
      </th>
    );
  };

  return (
    <div className="rounded-lg border border-line bg-surface">
      <table className="w-full border-separate border-spacing-0 text-left">
        <caption className="sr-only">{t("explorer.tableCaption")}</caption>
        <thead>
          <tr>{COLUMNS.map(header)}</tr>
        </thead>
        <tbody>
          {apis.map((api, i) => (
            <TableRow key={api.id} api={api} locale={locale} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STAGGER_CAP = 8;

function TableRow({ api, locale, index }: { api: ApiSummary; locale: Locale; index: number }) {
  const t = createT(locale);
  const href = ROUTES.api(locale, api.id);
  const cell = "border-b border-line px-2 py-3 align-top group-last/row:border-b-0";
  const open = (event: React.MouseEvent) => {
    // Links and buttons inside the row keep their own behaviour; anywhere else on the row opens the API.
    if ((event.target as Element).closest("a,button")) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) window.open(href, "_blank", "noopener");
    else window.location.assign(href);
  };
  return (
    <tr
      onClick={open}
      className="anim-rise group/row cursor-pointer transition-colors duration-150 hover:bg-brand-50 focus-within:bg-brand-50"
      style={{ "--i": Math.min(index, STAGGER_CAP) } as React.CSSProperties}
    >
      <td className={cx(cell, "row-accent w-16 pl-4")}>
        <StatusBadge status={api.status} locale={locale} size={20} />
      </td>
      <th scope="row" className={cx(cell, "text-left font-normal")}>
        <a href={href} className="line-clamp-2 break-words text-row font-semibold leading-snug text-ink transition-colors duration-150 hover:text-link focus-visible:rounded-sm">
          {api.name}
        </a>
        <span className="line-clamp-2 break-words text-small leading-snug text-ink-2">{api.provider}</span>
        <span className="mt-1 line-clamp-2 text-small text-ink-2 xl:hidden">{api.description}</span>
      </th>
      <td className={cx(cell, "hidden text-small text-ink-2 xl:table-cell")}>
        <span className="line-clamp-2">{api.description}</span>
      </td>
      <td className={cx(cell, "text-ink-3")}>
        <ApiSourceIcons api={api} locale={locale} />
      </td>
      <td className={cx(cell, "hidden md:table-cell")}>
        <ApiLicenseIcon api={api} locale={locale} />
      </td>
      <td className={cx(cell, "hidden lg:table-cell")}>
        <span title={t("explorer.trustTip", { score: api.trustScore, level: t(`trust.level.${api.trustLevel}`) })} className="inline-flex items-center gap-2 font-mono text-small tabular-nums">
          <span aria-hidden className={cx("size-2 rounded-full", LEVEL_DOT[api.trustLevel])} />
          {api.trustScore}
        </span>
      </td>
      <td className={cx(cell, "hidden pr-4 text-ink-2 md:table-cell")}>
        <ApiReviewed api={api} locale={locale} />
      </td>
    </tr>
  );
}
