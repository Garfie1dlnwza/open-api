import type { Locale } from "@thai-open-api/schema";
import { Check, CircleAlert, Copy, Terminal } from "lucide-react";
import { useMemo, useState } from "react";
import { UI } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import { formatBytes } from "../../lib/format.ts";
import { prettyBody, type PlaygroundResult } from "../../lib/playground.ts";
import { Button } from "../ui/Button.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";
import { cx } from "../ui/cx.ts";
import { useCopy } from "../ui/useCopy.ts";

export type ViewState = { phase: "idle" } | { phase: "loading" } | { phase: "done"; result: PlaygroundResult };

const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;

export function ResponseViewer({ state, locale, unavailable }: { state: ViewState; locale: Locale; unavailable: boolean }) {
  const t = createT(locale);
  const [mode, setMode] = useState<"pretty" | "raw">("pretty");
  const { copied, copy } = useCopy();
  const result = state.phase === "done" ? state.result : null;

  const shown = useMemo(() => {
    if (result?.kind !== "ok") return "";
    return mode === "pretty" ? prettyBody(result.body, result.contentType) : result.body;
  }, [result, mode]);

  if (unavailable) return <EmptyState icon={<CircleAlert aria-hidden size={26} />} title={t("playground.unavailableTitle")}>{t("playground.unavailableBody")}</EmptyState>;
  if (state.phase === "idle") return <EmptyState icon={<Terminal aria-hidden size={26} />} title={t("playground.idleTitle")}>{t("playground.idleBody")}</EmptyState>;
  if (state.phase === "loading") {
    return (
      <div role="status" aria-label={t("playground.sending")} className="flex flex-col gap-3 rounded-lg bg-subtle p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
        <div className="h-3 w-full animate-pulse rounded bg-line" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-line" />
      </div>
    );
  }
  if (result?.kind === "error") {
    const message = result.code === "network" ? t("playground.networkError") : result.code === "bad_reply" ? t("playground.badReply") : t(`playground.errors.${result.code}`);
    return (
      <div role="alert" className="flex gap-3 rounded-lg border border-error-dot bg-error-bg p-4 text-error-fg">
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
        <p className="text-small">{message}</p>
      </div>
    );
  }
  if (result?.kind !== "ok") return null;

  const ok = result.status >= HTTP_OK_MIN && result.status <= HTTP_OK_MAX;
  const clipped = shown.length > UI.responsePreviewChars;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small">
        <span className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-caption font-medium", ok ? "bg-success-bg text-success-fg" : "bg-error-bg text-error-fg")}>
          {ok ? <Check aria-hidden size={13} /> : <CircleAlert aria-hidden size={13} />}
          {result.status} {result.statusText}
        </span>
        <span className="text-ink-2">{t("playground.time", { ms: result.durationMs })}</span>
        <span className="text-ink-2">{t("playground.size", { size: formatBytes(result.sizeBytes, t) })}</span>
      </div>
      {result.truncated && <p className="text-caption text-warning-fg">{t("playground.truncated")}</p>}
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label={t("playground.response")} className="inline-flex rounded-md border border-control p-0.5">
          {(["pretty", "raw"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cx("h-8 rounded px-3 text-caption font-medium transition-colors duration-150", mode === m ? "bg-brand-100 text-brand-800" : "text-ink-2 hover:text-ink")}>
              {t(`playground.${m}`)}
            </button>
          ))}
        </div>
        <Button variant="secondary" className="h-8 px-3 text-caption" onClick={() => copy(result.body)} icon={copied ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}>
          <span aria-live="polite">{copied ? t("playground.copied") : t("playground.copyResponse")}</span>
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg bg-code-bg p-4 text-code text-code-fg"><code>{clipped ? shown.slice(0, UI.responsePreviewChars) : shown}</code></pre>
      {clipped && <p className="text-caption text-ink-2">{t("playground.previewTruncated")}</p>}
    </div>
  );
}
