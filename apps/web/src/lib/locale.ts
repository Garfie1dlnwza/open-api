import { LOCALES, type Locale } from "@thai-open-api/schema";

const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

/** Same page in another language: swap the leading /th or /en segment. */
export const switchLocalePath = (pathname: string, target: Locale): string => pathname.replace(LOCALE_PREFIX, `/${target}`);
