import type { ApiEntry, Auth } from "./entry.ts";
import { LIMITS, USER_AGENT } from "./constants.ts";

/** What redirect handling needs to know about an API; satisfied by WorkerApi and by a catalog entry. */
export interface RedirectPolicy {
  auth: Auth;
  allowedHosts: string[];
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

export const policyFromEntry = (api: Pick<ApiEntry, "auth" | "baseUrl" | "redirectHosts">): RedirectPolicy => ({
  auth: api.auth,
  allowedHosts: [new URL(api.baseUrl).host, ...api.redirectHosts],
});

export const redirectAllowed = (policy: RedirectPolicy, from: URL, to: URL): boolean =>
  to.protocol === from.protocol && policy.allowedHosts.includes(to.host) && !to.username && !to.password;

/**
 * GET with redirects followed by hand, so every hop is checked against the catalog. Keyed APIs
 * may only redirect within their own host, which keeps the credential from travelling elsewhere.
 * Returns null when a redirect is refused, malformed or exceeds the hop limit. Shared by the
 * Worker and the health check so neither can be bounced to an internal address.
 */
export async function fetchWithRedirects(
  policy: RedirectPolicy,
  start: URL,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
  accept: string,
  /** Optional per-hop check, e.g. "does this host resolve to a public address?" (health script). */
  guard?: (url: URL) => Promise<boolean>,
): Promise<Response | null> {
  let url = start;
  for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
    if (guard && !(await guard(url))) return null;
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { accept, "user-agent": USER_AGENT, ...headers },
      redirect: "manual",
      signal: AbortSignal.timeout(LIMITS.upstreamTimeoutMs),
    });
    if (!REDIRECT_STATUSES.includes(res.status)) return res;

    const location = res.headers.get("location");
    await res.body?.cancel();
    if (!location) return null;
    let next: URL;
    try {
      next = new URL(location, url);
    } catch {
      return null;
    }
    const keyLeavesHost = policy.auth.type === "apiKey" && next.host !== url.host;
    if (keyLeavesHost || !redirectAllowed(policy, url, next)) return null;
    url = next;
  }
  return null;
}

/** Reads at most maxBytes of a response body as text, cancelling the rest of the stream. */
export async function readLimited(res: Response, maxBytes: number): Promise<{ text: string; sizeBytes: number; truncated: boolean }> {
  if (!res.body) return { text: "", sizeBytes: 0, truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - size;
    if (value.byteLength > room) {
      chunks.push(value.subarray(0, room));
      size += room;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), sizeBytes: size, truncated };
}
