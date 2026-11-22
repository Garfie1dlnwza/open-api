import type { Locale } from "@thai-open-api/schema";
import { TriangleAlert } from "lucide-react";
import { createT } from "../../i18n/index.ts";

export function KnownIssue({ text, locale }: { text: string; locale: Locale }) {
  return (
    <aside role="note" className="flex gap-3 rounded-lg border border-warning-dot bg-warning-bg p-4 text-warning-fg">
      <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
      <div className="text-small">
        <p className="font-semibold">{createT(locale)("api.knownIssue")}</p>
        <p className="mt-1">{text}</p>
      </div>
    </aside>
  );
}
