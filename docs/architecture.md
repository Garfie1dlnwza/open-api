# Architecture

```
catalog/*.yaml ──► @thai-open-api/schema (Zod) ──► apps/web   (static pages, search index)
                                  │            └──► scripts/build-worker-catalog ──► apps/worker
                                  └──► scripts/health-check ──► data/status.json
```

## Runtime separation

| Part | Depends on | If it is down |
|---|---|---|
| Catalog pages, docs, code samples | Static files built from `catalog/` | n/a |
| Status badges and trust stability | `status.json`, read at build time | Pages show "Unknown" once data is older than 72 h |
| Playground | The Worker | Only "Send request" fails; docs and "Copy cURL" keep working |

## One request builder

`packages/schema/src/url.ts` is the only place an upstream URL is built. The Worker uses it for real
calls and the code samples use it for what you copy, so they cannot drift apart.

## Playground Worker

The browser sends `{ apiId, endpointId, params, authValue? }`. It never sends a URL, method or headers.

1. Request body is parsed with a strict schema; unknown fields are rejected.
2. `apiId` / `endpointId` must exist in the generated catalog (own-property lookup).
3. Params must be declared by the endpoint and pass its type/range/enum/pattern rules; path values
   are restricted to `[A-Za-z0-9._~-]` and cannot be `.` or `..`. Catalog `pattern`s may only use a
   small regex subset (literals, classes, `?` `*` `+` `{n,m}` on single atoms; no groups or
   alternation), so catastrophic backtracking is impossible rather than merely detected, and a
   pattern-checked value is at most 64 characters.
4. The final URL must stay under the API's base URL origin and path.
5. Redirects are followed by hand, at most 3, each checked against the API's allowed hosts. Keyed
   APIs may only redirect within their own host so a key never travels elsewhere.
6. Responses are capped (default 1 MB), only JSON, XML and text are returned, and errors never echo
   upstream details. A stream that dies mid-body is answered in the normal error envelope. API keys
   are not logged or stored.
7. Origin allowlist plus a per-IP rate limit. The rate-limit binding is required: without it the Worker
   answers `server_misconfigured` (500) instead of running unthrottled. The Origin header is
   client-controlled, so it is a guard against casual abuse, not a security boundary; steps 1-6 are.

## Health model

Per endpoint the check requests the catalog's example, then evaluates:

- network error / timeout / TLS failure / blocked redirect / 5xx → **Outage**
- 401/403 on a keyed API → **Authentication required**; on a keyless API → **Outage**
- 429, slower than the threshold, or an optional body check failing → **Degraded**
- 2xx but not JSON when JSON is expected, or a required body check failing → **Outage**
- no result, or a result older than 72 h → **Unknown**

An API's status rolls up from its endpoints. Results are published to the `status-data` branch every
six hours (see `.github/workflows/health.yml`) and the last 30 results are kept as history.

## Trust score (0-100)

Source 30 · docs 15 · licence 15 · last review 15 · stability 15 · tested example 10.
Stability counts only after 7 samples. A licence is fully credited only when a human marked it
verified. The score is always shown with its breakdown.

## Hardening notes

- **Hostnames.** `baseUrl` and `redirectHosts` must be public fully-qualified names. IP literals,
  internal suffixes (`.local`, `.internal`, `.localhost`, ...) and wildcard-DNS services that embed an
  IP (`*.nip.io`, `*.sslip.io`, ...) are refused.
- **Health probe.** The GitHub runner can reach networks the Worker cannot (cloud metadata), so
  `scripts/health-check.ts` additionally resolves every hop's hostname and refuses non-public
  addresses (`packages/schema/src/dns-guard.ts`), and caps the body it reads. DNS answers can change
  between the check and the connection (rebinding); the allowlist and the lack of credentials on the
  runner during the probe are the other layers.
- **status.json** crosses a trust boundary (the `status-data` branch), so it is validated with a
  schema when loaded; a malformed file means "no data", never a failed build or injected text.
- **Browser.** `apps/web/public/_headers` sets `frame-ancestors 'none'`, `nosniff`, a referrer policy
  and a permissions policy on Cloudflare Pages. Astro's CSP support adds a `<meta>` policy with hashes
  for its own inline scripts and styles; only inline `style` *attributes* are allowed, and the only
  network origin besides the site is the playground Worker.
- **CI.** The health and deploy jobs check out with `persist-credentials: false`, pass repository
  variables through `env:` rather than into shell lines, and reduce `PUBLIC_SITE_URL` to a bare origin
  so the Worker's allowlist matches the browser's `Origin`.
