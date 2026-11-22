# Contributing

## Branches

| Branch | Purpose |
|---|---|
| `main` | Released code. Only receives merges from `develop` (and hotfixes). Deploys to production. |
| `develop` | Integration branch. Open pull requests against this one. |
| `feat/*`, `fix/*`, `docs/*` | Short-lived branches cut from `develop`. |

Never push directly to `main`. Releases are described in [docs/release.md](docs/release.md).

## Commits

[Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Useful scopes: `schema`, `catalog`, `web`, `worker`, `health`.

Versions and the changelog are generated from these messages, so a `feat` bumps the minor version
and a `fix` bumps the patch. Add `!` (e.g. `feat(schema)!: ...`) for breaking changes.

## Before you push

```bash
npm run check
```

## Adding an API

Create `catalog/<id>.yaml`; the file name must equal the `id`. Minimal example:

```yaml
id: example-api
name: { th: ตัวอย่าง API, en: Example API }
provider:
  name: { th: หน่วยงานตัวอย่าง, en: Example Agency }
  url: https://www.example.go.th/
description:
  th: อธิบายสั้น ๆ ว่า API นี้ให้ข้อมูลอะไร
  en: One or two sentences on what this API returns.
category: government        # government | finance | environment | geography | energy
source: official            # official | community | unofficial
auth: { type: none }
baseUrl: https://api.example.go.th/v1
docsUrl: https://api.example.go.th/docs
license: { type: unknown, verified: false }
reviewedAt: 2026-11-22
endpoints:
  - id: list
    path: /items
    title: { th: รายการ, en: List items }
    description: { th: ดึงรายการทั้งหมด, en: Returns all items. }
    example: {}
    response:
      format: json
    health:
      checks:
        - { kind: json, path: items, type: array, minItems: 1 }
```

Rules the validator enforces: both Thai and English text everywhere, public https hostnames only
(no IPs, no wildcard-DNS names such as `*.nip.io`), every path placeholder declared, and examples that
satisfy their own parameter rules. A parameter `pattern` may only use literals, character classes and
`?` `*` `+` `{n,m}` on single atoms (for example `^[A-Z]{3}$`); groups and alternation are rejected on
purpose.

### Parameter fields

| Field | Meaning |
|---|---|
| `name`, `in` | Name and where it goes: `query` or `path` (path params must be `required` and appear as `{name}`) |
| `type` | `string` (default), `integer`, `number`, `boolean`, `date` (YYYY-MM-DD) |
| `required` | Defaults to false. A required param needs a `default` or an `example` value |
| `enum` | The only allowed values; the playground shows a dropdown |
| `pattern` | A small regex subset, fully anchored for you (`[A-Z]{3}`) |
| `min`, `max` | Numeric range, or length for strings |
| `default` | Used when the caller leaves it empty |
| `description` | Thai and English |

### Other endpoint and API fields

- `example`: values for the "Use example values" button, the code samples **and the health check**.
- `playground: false` hides the playground for an endpoint (or for the whole API if all are off).
- `knownIssue` (API level): a provider-side problem shown prominently, e.g. a broken certificate chain.
- `rateLimit`: free text, shown under the licence.
- `maxResponseBytes`: raise it (up to 2,000,000) only for genuinely large responses; bigger bodies are cut off.
- `health.slowMs`: the point where a slow endpoint is reported as Degraded (default 3000 ms).
- `reviewedAt` must be a past date (YYYY-MM-DD).

Be honest in the metadata:

- Set `license.verified: true` only after you read the licence or terms.
- Add `health.checks` that look inside the body. An endpoint that can return `200` with an error
  page must be caught by a check, not trusted.
- Never put real credentials in the catalog. Keyed APIs are probed without a key and shown as
  "Authentication required".
- Use `knownIssue` for provider-side problems users should know about up front.

## Design

Read [docs/design-system](docs/design-system) before changing the UI. Short version: tokens only (no
literal colours), status/source as icons with accessible names, ruled lists instead of card grids,
charts that answer one question each, and motion that respects `prefers-reduced-motion`.

## Where things live

- User-facing text: `apps/web/src/i18n/messages/{th,en}.ts` (both required; a test checks parity).
- Colours: `apps/web/src/styles/tokens.css` only. Use the Tailwind names (`bg-surface`, `text-ink`).
- Routes, query keys and storage keys: `apps/web/src/config/site.ts`.
