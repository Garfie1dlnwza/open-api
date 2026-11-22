# Thai Open API

A developer-focused hub for Thailand's public APIs: government and open-data endpoints with
verified docs, ready-to-copy code, live status and a playground that calls the real API.

- **Catalog** – one YAML file per API in [`catalog/`](catalog), validated by a shared Zod schema.
- **Status, not just "online"** – Operational, Degraded, Outage, Unknown, Authentication required.
  A health check inspects response bodies; an HTTP 200 alone never counts as healthy.
- **Trust score** – source, docs, licence, last review, historical stability and tested examples,
  shown as a breakdown rather than a bare number.
- **Playground** – a Cloudflare Worker that accepts catalog IDs only (never URLs).
- **Thai and English** from the start.

## Layout

```
catalog/            API entries (the single source of truth)
packages/schema/    Zod schema, request builder, health + trust logic (shared by everything)
apps/web/           Astro site (static) with React islands
apps/worker/        Playground proxy (Cloudflare Worker)
scripts/            catalog validation, worker catalog build, health check, repo checks
docs/               architecture, release process, design system
```

The site reads the catalog from static files. If the Worker is down you can still read every page
and copy code; only "Send request" stops working.

## Develop

Needs **Node 22.23.4 or newer** (`nvm use`), because Astro 7 requires it.

```bash
npm install
npm run health          # optional: writes data/status.json for real status badges
npm run catalog:build   # generates the Worker's catalog from catalog/*.yaml
cp .env.example apps/web/.env

npm run dev -w @thai-open-api/worker   # playground proxy on http://127.0.0.1:8787 (or --port)
npm run dev                            # site on http://localhost:4321
```

If port 8787 is taken, run the Worker with `npx wrangler dev --port 8788` in `apps/worker` and
point `PUBLIC_PLAYGROUND_URL` at it.

Useful URLs: `/th/`, `/en/`, `/th/apis/`, `/th/apis/<id>/`, e.g. `?q=ฝุ่น` or `?category=finance&status=auth_required`.

## Checks

```bash
npm run check
```

Runs catalog validation, typecheck (including `astro check`), ESLint, a hardcoded-values check
(no inline Thai text, colours, routes or storage keys outside their config files), a duplication
check (`jscpd`) and all tests. CI runs the same command.

## Contributing and releases

See [CONTRIBUTING.md](CONTRIBUTING.md) (branching, commit format, how to add an API) and
[docs/release.md](docs/release.md).
