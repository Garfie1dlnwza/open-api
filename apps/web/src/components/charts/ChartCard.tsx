import type { Locale } from "@thai-open-api/schema";
import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";
import { createT } from "../../i18n/index.ts";
import { rowKeys } from "../../lib/tableKeys.ts";
import { cx } from "../ui/cx.ts";

export interface TableView {
  headers: string[];
  rows: (string | number)[][];
}

/**
 * A titled slot, not a box: a hairline above, the question the chart answers, the chart, and the
 * same data as a table underneath for anyone who cannot or would rather not read the graphic.
 */
export function ChartCard({ title, question, table, locale, children, className }: { title: string; question: string; table: TableView; locale: Locale; children: ReactNode; className?: string }) {
  const t = createT(locale);
  const id = useId();
  const keys = rowKeys(table.rows);
  return (
    <section aria-labelledby={id} className={cx("glass flex min-w-0 flex-col gap-4 rounded-2xl p-5", className)}>
      <header>
        <h3 id={id} className="text-small font-semibold">{title}</h3>
        <p className="text-caption text-ink-2">{question}</p>
      </header>
      <div className="flex-1">{children}</div>
      <details className="group text-caption">
        <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-ink-2 transition-colors duration-150 hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">{t("dashboard.tableShow")}</span>
          <span className="hidden group-open:inline">{t("dashboard.tableHide")}</span>
          <ChevronDown aria-hidden size={14} className="transition-transform duration-150 group-open:rotate-180" />
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-line text-ink-2">
                {table.headers.map((h) => <th key={h} scope="col" className="py-1.5 pr-4 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {keys.map((key, index) => (
                <tr key={key} className="border-b border-line last:border-0">
                  {table.rows[index].map((cell, i) => <td key={`${key}:${i}`} className="py-1.5 pr-4">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
