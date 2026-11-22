import { PlaygroundResponseSchema, type ApiEntry, type Auth, type Endpoint, type LocalizedText, type PlaygroundErrorCode } from "@thai-open-api/schema";
import { SITE, UI } from "../config/site.ts";

/** What the playground island needs; everything else in the catalog stays on the server. */
export interface PlaygroundApi {
  id: string;
  baseUrl: string;
  auth: Auth;
  providerName: LocalizedText;
  endpoints: Endpoint[];
}

export function toPlaygroundApi(entry: ApiEntry): PlaygroundApi | null {
  const endpoints = entry.endpoints
    .filter((e) => e.playground)
    .map((e) => ({ ...e, response: { format: e.response.format }, health: { checks: [] } }));
  if (endpoints.length === 0) return null;
  return { id: entry.id, baseUrl: entry.baseUrl, auth: entry.auth, providerName: entry.provider.name, endpoints };
}

export const initialValues = (endpoint: Endpoint): Record<string, string> => ({ ...endpoint.example });

export type PlaygroundResult =
  | { kind: "ok"; status: number; statusText: string; contentType: string; durationMs: number; sizeBytes: number; truncated: boolean; body: string }
  | { kind: "error"; code: PlaygroundErrorCode | "network" | "bad_reply"; message?: string };

export async function callPlayground(body: { apiId: string; endpointId: string; params: Record<string, string>; authValue?: string }): Promise<PlaygroundResult> {
  try {
    const res = await fetch(SITE.playgroundUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UI.playgroundClientTimeoutMs),
    });
    const parsed = PlaygroundResponseSchema.safeParse(await res.json());
    if (!parsed.success) return { kind: "error", code: "bad_reply" };
    if (!parsed.data.ok) return { kind: "error", code: parsed.data.error.code, message: parsed.data.error.message };
    return { kind: "ok", ...parsed.data.upstream };
  } catch {
    return { kind: "error", code: "network" };
  }
}

const MARKUP_TOKEN = /(<[^>]+>)/;
const MAX_INDENT_DEPTH = 24;

/**
 * Indents well-formed XML, one tag per line, keeping short text elements on one line. The work is
 * bounded on purpose, because the body comes from a third party: only the part the viewer can show
 * is formatted, indentation stops growing past MAX_INDENT_DEPTH (so deep nesting cannot make the
 * output quadratic), and building stops once the output passes the preview limit. A document with
 * CDATA is returned untouched: its content may contain ">" and cannot be split safely this way.
 */
export function prettyXml(xml: string): string {
  if (xml.includes("<![CDATA[")) return xml;
  const tokens = xml.slice(0, UI.responsePreviewChars).replace(/>\s+</g, "><").trim().split(MARKUP_TOKEN).filter(Boolean);
  const pad = (depth: number) => "  ".repeat(Math.min(depth, MAX_INDENT_DEPTH));
  const lines: string[] = [];
  let depth = 0;
  let length = 0;
  const push = (line: string) => {
    lines.push(line);
    length += line.length + 1;
  };
  for (let i = 0; i < tokens.length && length <= UI.responsePreviewChars; i++) {
    const token = tokens[i];
    if (token.startsWith("</")) {
      depth = Math.max(depth - 1, 0);
      push(`${pad(depth)}${token}`);
    } else if (!token.startsWith("<") || token.startsWith("<?") || token.startsWith("<!") || token.endsWith("/>")) {
      push(`${pad(depth)}${token}`);
    } else if (tokens[i + 1] && !tokens[i + 1].startsWith("<") && tokens[i + 2]?.startsWith("</")) {
      push(`${pad(depth)}${token}${tokens[i + 1]}${tokens[i + 2]}`);
      i += 2;
    } else {
      push(`${pad(depth)}${token}`);
      depth++;
    }
  }
  return lines.join("\n");
}

/**
 * True when the viewer is not showing everything. For pretty XML the formatter only reads the first
 * responsePreviewChars of the body, so truncation is judged from the real body, never from the length of
 * the formatted text (collapsing whitespace can make that shorter than the cut-off).
 */
export function isPreviewClipped(body: string, shown: string, contentType: string, mode: "pretty" | "raw"): boolean {
  const xmlCut = mode === "pretty" && /xml/i.test(contentType) && body.length > UI.responsePreviewChars;
  return xmlCut || shown.length > UI.responsePreviewChars;
}

/** Pretty-prints JSON or XML when possible; anything else is returned as-is. */
export function prettyBody(body: string, contentType: string): string {
  if (/xml/i.test(contentType)) return prettyXml(body);
  if (!/json/i.test(contentType)) return body;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
