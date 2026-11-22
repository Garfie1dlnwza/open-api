import type { Auth, Param } from "./entry.ts";
import { resolveParams } from "./params.ts";

export interface UrlApi {
  baseUrl: string;
  auth: Auth;
}
export interface UrlEndpoint {
  path: string;
  params: Param[];
}

export type BuiltRequest =
  | { ok: true; url: URL; headers: Record<string, string> }
  | { ok: false; name: string; message: string };

/**
 * The only place an upstream URL is ever constructed. Both the Worker (real calls) and
 * the code samples go through it, so what users copy is what the Worker would send.
 */
export function buildRequest(
  api: UrlApi,
  endpoint: UrlEndpoint,
  input: Record<string, string>,
  authValue?: string,
): BuiltRequest {
  const resolved = resolveParams(endpoint.params, input);
  if (!resolved.ok) return resolved;
  const { values } = resolved;

  const base = new URL(api.baseUrl);
  const basePath = base.pathname.replace(/\/+$/, "");
  const path = endpoint.path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(values[name]));
  const url = new URL(`${base.origin}${basePath}${path}`);

  for (const param of endpoint.params) {
    if (param.in === "query" && values[param.name] !== undefined) url.searchParams.append(param.name, values[param.name]);
  }

  const headers: Record<string, string> = {};
  if (api.auth.type === "apiKey" && authValue) {
    if (api.auth.in === "header") headers[api.auth.name] = authValue;
    else url.searchParams.append(api.auth.name, authValue);
  }

  const escapesBase = url.origin !== base.origin || !(url.pathname === basePath || url.pathname.startsWith(`${basePath}/`));
  if (escapesBase) return { ok: false, name: "path", message: "resolved outside the API base URL" };
  return { ok: true, url, headers };
}
