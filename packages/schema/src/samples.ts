import { AUTH_PLACEHOLDER } from "./constants.ts";
import type { ApiEntry, Endpoint } from "./entry.ts";
import { buildRequest } from "./url.ts";

export const SAMPLE_LANGS = ["curl", "javascript", "python"] as const;
export type SampleLang = (typeof SAMPLE_LANGS)[number];

export interface SampleRequest {
  url: string;
  headers: Record<string, string>;
}

/** The real upstream request for the given values, with the key replaced by a placeholder. */
export function sampleRequest(
  api: Pick<ApiEntry, "baseUrl" | "auth">,
  endpoint: Pick<Endpoint, "path" | "params" | "example">,
  values: Record<string, string> = endpoint.example,
): SampleRequest | null {
  const built = buildRequest(api, endpoint, values, AUTH_PLACEHOLDER);
  return built.ok ? { url: built.url.toString(), headers: built.headers } : null;
}

const shellQuote = (s: string) => `'${s.replaceAll("'", "'\\''")}'`;
const headerEntries = (h: Record<string, string>) => Object.entries(h);

const renderers: Record<SampleLang, (req: SampleRequest) => string> = {
  curl: ({ url, headers }) =>
    ["curl", ...headerEntries(headers).map(([k, v]) => `-H ${shellQuote(`${k}: ${v}`)}`), shellQuote(url)].join(" \\\n  "),
  javascript: ({ url, headers }) => {
    const init = headerEntries(headers).length ? `, {\n  headers: ${JSON.stringify(headers, null, 2).replaceAll("\n", "\n  ")},\n}` : "";
    return `const res = await fetch(${JSON.stringify(url)}${init});\nconst data = await res.json();\nconsole.log(data);`;
  },
  python: ({ url, headers }) => {
    const args = headerEntries(headers).length ? `, headers=${JSON.stringify(headers)}` : "";
    return `import requests\n\nres = requests.get(${JSON.stringify(url)}${args}, timeout=10)\nprint(res.json())`;
  },
};

export function renderSample(lang: SampleLang, request: SampleRequest): string {
  return renderers[lang](request);
}
