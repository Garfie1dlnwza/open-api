import { DEFAULT_LOCALE, type Locale } from "@thai-open-api/schema";
import { en } from "./messages/en.ts";
import { th } from "./messages/th.ts";

/** Thai is the source of truth for the message shape; English must match it exactly. */
export type Messages = typeof th;

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;
export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

const bundles: Record<Locale, Messages> = { th, en };

export const getMessages = (locale: Locale): Messages => bundles[locale] ?? bundles[DEFAULT_LOCALE];

const lookup = (messages: Messages, key: string): string | undefined => {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
  return typeof value === "string" ? value : undefined;
};

export function createT(locale: Locale): Translate {
  const messages = getMessages(locale);
  return (key, vars) => {
    const template = lookup(messages, key) ?? key;
    return vars ? template.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match)) : template;
  };
}

/** Flattens a message tree to dotted keys; used by tests to compare locales. */
export function flattenKeys(tree: unknown, prefix = ""): string[] {
  if (typeof tree === "string") return [prefix];
  return Object.entries(tree as Record<string, unknown>).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k));
}
