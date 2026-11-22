import type { Locale } from "@thai-open-api/schema";
import { Check, Copy } from "lucide-react";
import { createT } from "../../i18n/index.ts";
import { useCopy } from "../ui/useCopy.ts";

export function CodeBlock({ code, label, locale }: { code: string; label?: string; locale: Locale }) {
  const t = createT(locale);
  const { copied, copy } = useCopy();
  return (
    <div className="overflow-hidden rounded-lg bg-code-bg">
      <div className="flex items-center justify-between gap-3 px-4 pt-2 text-caption text-code-muted">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-code-fg transition-colors duration-150 hover:bg-code-fg/10"
        >
          {copied ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}
          <span aria-live="polite">{copied ? t("common.copied") : t("common.copy")}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pb-4 pt-2 text-code text-code-fg"><code>{code}</code></pre>
    </div>
  );
}
