import { SAMPLE_LANGS, type Locale } from "@thai-open-api/schema";
import { createT } from "../../i18n/index.ts";
import { CodeBlock } from "../playground/CodeBlock.tsx";
import { Tabs } from "../ui/Tabs.tsx";

const LANG_LABEL = { curl: "cURL", javascript: "JavaScript", python: "Python" } as const;

export function CodeTabs({ samples, locale }: { samples: Record<(typeof SAMPLE_LANGS)[number], string>; locale: Locale }) {
  return (
    <Tabs
      label={createT(locale)("api.tabLabel")}
      items={SAMPLE_LANGS.map((lang) => ({ id: lang, label: LANG_LABEL[lang], content: <CodeBlock code={samples[lang]} locale={locale} /> }))}
    />
  );
}
