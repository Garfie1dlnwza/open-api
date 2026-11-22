import { MS_PER_DAY, MS_PER_HOUR, type Locale } from "@thai-open-api/schema";
import type { Translate } from "../i18n/index.ts";

const BYTES_PER_KB = 1_024;
const BYTES_PER_MB = BYTES_PER_KB * 1_024;
const ONE_DECIMAL = 10;

const MS_PER_MINUTE = 60_000;

/** One collator per locale, so server and browser always order text the same way (no hydration drift). */
const collators = new Map<Locale, Intl.Collator>();
export const collatorFor = (locale: Locale): Intl.Collator => {
  let collator = collators.get(locale);
  if (!collator) collators.set(locale, (collator = new Intl.Collator(locale)));
  return collator;
};

/** "16 minutes ago" for real timestamps (probe results). Not for date-only values: see formatShortDate. */
export function formatRelative(iso: string, now: Date, locale: Locale): string {
  const elapsed = Math.max(now.getTime() - Date.parse(iso), 0);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (elapsed < MS_PER_HOUR) return rtf.format(-Math.max(1, Math.round(elapsed / MS_PER_MINUTE)), "minute");
  if (elapsed < MS_PER_DAY) return rtf.format(-Math.round(elapsed / MS_PER_HOUR), "hour");
  return rtf.format(-Math.round(elapsed / MS_PER_DAY), "day");
}

/** "22 Nov": a review date has no time of day, so it is shown as a date, never as "13 hours ago". */
export const formatShortDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));

/** Fixed time zone keeps the output identical between the build machine and the browser. */
export const formatDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));

export function formatBytes(bytes: number, t: Translate): string {
  if (bytes < BYTES_PER_KB) return t("common.bytes", { n: bytes });
  const round = (n: number) => Math.round(n * ONE_DECIMAL) / ONE_DECIMAL;
  return bytes < BYTES_PER_MB
    ? t("common.kilobytes", { n: round(bytes / BYTES_PER_KB) })
    : t("common.megabytes", { n: round(bytes / BYTES_PER_MB) });
}
