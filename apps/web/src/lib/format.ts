import { MS_PER_DAY, MS_PER_HOUR, type Locale } from "@thai-open-api/schema";
import type { Translate } from "../i18n/index.ts";

const BYTES_PER_KB = 1_024;
const BYTES_PER_MB = BYTES_PER_KB * 1_024;
const ONE_DECIMAL = 10;

/** "2 days ago" / "เมื่อ 2 วันที่แล้ว", computed at build time so server and client agree. */
export function formatRelative(iso: string, now: Date, locale: Locale, style: "long" | "narrow" = "long"): string {
  const elapsed = now.getTime() - Date.parse(iso);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
  if (elapsed < MS_PER_DAY) return rtf.format(-Math.max(1, Math.round(elapsed / MS_PER_HOUR)), "hour");
  return rtf.format(-Math.round(elapsed / MS_PER_DAY), "day");
}

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
