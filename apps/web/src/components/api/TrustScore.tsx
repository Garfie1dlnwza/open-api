import type { Locale, TrustScore as Score } from "@thai-open-api/schema";
import { createT } from "../../i18n/index.ts";
import { cx } from "../ui/cx.ts";

// Bar colour follows each factor's own state, never the overall level: a full bar must not look red.
const STATE_CLASS = { pass: "bg-success-dot", partial: "bg-warning-dot", fail: "bg-error-dot", unknown: "bg-line-strong" } as const;

export function TrustScore({ trust, locale }: { trust: Score; locale: Locale }) {
  const t = createT(locale);
  return (
    <section aria-labelledby="trust-title" className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="trust-title" className="text-h4 font-semibold">
          {t("trust.title")}
        </h3>
        <p className="text-small">
          <strong className="text-h3 font-semibold">{trust.score}</strong>
          <span className="text-ink-2"> / 100 · {t(`trust.level.${trust.level}`)}</span>
        </p>
      </div>
      <p className="mt-1 text-caption text-ink-2">{t("trust.explain")}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {trust.factors.map((factor) => (
          <li key={factor.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="text-small">{t(`trust.factors.${factor.id}`)}</span>
            <span className="text-caption text-ink-2">
              {factor.state === "unknown" ? t("trust.state.unknown") : `${t(`trust.state.${factor.state}`)} · ${t("trust.points", { points: factor.points, max: factor.max })}`}
            </span>
            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-subtle" role="presentation">
              <div className={cx("h-full rounded-full", STATE_CLASS[factor.state])} style={{ width: `${(factor.points / factor.max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
