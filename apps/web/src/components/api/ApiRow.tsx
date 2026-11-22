import type { Locale } from "@thai-open-api/schema";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "../../config/site.ts";
import type { ApiSummary } from "../../lib/summary.ts";
import { StatusBadge } from "./StatusBadge.tsx";
import { ApiLicenseIcon, ApiReviewed, ApiSourceIcons } from "./ApiCells.tsx";

const STAGGER_CAP = 8;

/** Column template at xl and above (the home page's featured list). */
export const ROW_COLUMNS = "xl:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.5fr)_9.5rem]";

/**
 * One API as one line of a ruled list. Below xl it is three columns with the description under the name
 * (a four-column row gets cramped beside the sidebar); from xl the description has its own column.
 * Status, source and "needs a key" are icons, named once in the legend and in each icon's accessible name.
 * The whole row is the link: a bar slides in on hover or focus, the row tints, and a chevron appears.
 */
export function ApiRow({ api, locale, index = 0 }: { api: ApiSummary; locale: Locale; index?: number }) {
  return (
    <a
      href={ROUTES.api(locale, api.id)}
      className={`anim-rise group relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-4 py-3.5 transition-colors duration-150 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:scale-y-0 before:bg-link before:transition-transform before:duration-200 hover:bg-brand-50 hover:before:scale-y-100 focus-visible:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 focus-visible:before:scale-y-100 xl:items-center ${ROW_COLUMNS}`}
      style={{ "--i": Math.min(index, STAGGER_CAP) } as React.CSSProperties}
    >
      <span className="pt-0.5 xl:justify-self-center xl:pt-0">
        <StatusBadge status={api.status} locale={locale} size={20} />
      </span>
      <span className="min-w-0">
        <strong className="line-clamp-2 break-words text-row font-semibold leading-snug transition-colors duration-150 group-hover:text-link">{api.name}</strong>
        <span className="line-clamp-2 break-words text-small leading-snug text-ink-2">{api.provider}</span>
      </span>
      <span className="col-span-2 col-start-2 row-start-2 line-clamp-2 text-small text-ink-2 xl:col-span-1 xl:col-start-auto xl:row-start-auto">{api.description}</span>
      <span className="flex items-center justify-end gap-3 pt-0.5 text-ink-3 xl:pt-0">
        <ApiSourceIcons api={api} locale={locale} />
        <ApiLicenseIcon api={api} locale={locale} onlyVerified />
        <span className="w-12 text-right"><ApiReviewed api={api} locale={locale} /></span>
        <ChevronRight aria-hidden size={16} className="-ml-1 -translate-x-1 text-link opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
      </span>
    </a>
  );
}
