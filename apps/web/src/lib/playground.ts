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

/** Pretty-prints JSON when possible; anything else is returned as-is. */
export function prettyBody(body: string, contentType: string): string {
  if (!/json/i.test(contentType)) return body;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
