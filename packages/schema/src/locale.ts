import { z } from "zod";

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";

/** Every user-facing catalog string must exist in all locales. */
export const LocalizedText = z.strictObject(
  Object.fromEntries(LOCALES.map((l) => [l, z.string().min(1)])) as Record<Locale, z.ZodString>,
);
export type LocalizedText = z.infer<typeof LocalizedText>;

export const localize = (text: LocalizedText, locale: Locale): string => text[locale];

export const isLocale = (value: string | undefined): value is Locale =>
  LOCALES.includes(value as Locale);
