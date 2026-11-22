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

Rules the validator enforces: both Thai and English text everywhere, public https hostnames only,
every path placeholder declared, and examples that satisfy their own parameter rules.

Be honest in the metadata:

- Set `license.verified: true` only after you read the licence or terms.
- Add `health.checks` that look inside the body. An endpoint that can return `200` with an error
  page must be caught by a check, not trusted.
- Never put real credentials in the catalog. Keyed APIs are probed without a key and shown as
  "Authentication required".
- Use `knownIssue` for provider-side problems users should know about up front.

## Where things live

- User-facing text: `apps/web/src/i18n/messages/{th,en}.ts` (both required; a test checks parity).
- Colours: `apps/web/src/styles/tokens.css` only. Use the Tailwind names (`bg-surface`, `text-ink`).
- Routes, query keys and storage keys: `apps/web/src/config/site.ts`.
