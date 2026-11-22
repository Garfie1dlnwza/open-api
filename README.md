# Thai Open API

A developer-focused hub for Thailand's public APIs: government and open-data endpoints with
verified docs, ready-to-copy code, live status and a playground that calls the real API.

- **Catalog** – one YAML file per API in [`catalog/`](catalog), validated by a shared Zod schema.
- **Status, not just "online"** – Operational, Degraded, Outage, Unknown, Authentication required.
  A health check inspects response bodies; an HTTP 200 alone never counts as healthy.
- **Trust score** – source, docs, licence, last review, historical stability and tested examples,
  shown as a breakdown rather than a bare number.
- **Playground** – a Cloudflare Worker that accepts catalog IDs only (never URLs).
- **Dashboard** with charts computed from the catalog and real probe history (no sample data).
- **Thai and English** from the start.

## Layout

```
brand/              source logo (images are derived from it)
catalog/            API entries (the single source of truth)
packages/schema/    Zod schema, request builder, health + trust logic (shared by everything)
apps/web/           Astro site (static) with React islands
apps/worker/        Playground proxy (Cloudflare Worker)
scripts/            catalog validation, worker catalog build, health check, repo checks
docs/               architecture, release process, design system
```

The site reads the catalog from static files. If the Worker is down you can still read every page
and copy code; only "Send request" stops working.

## Run it locally

```bash
nvm install && nvm use      # Astro 7 needs Node 22.23.4+; .nvmrc says which
npm install
cp .env.example apps/web/.env   # once; points the site at the local playground proxy
npm run dev
```

`npm run dev` checks Node and the ports, regenerates the Worker's catalog, then starts the playground
proxy (http://127.0.0.1:8788) and the site (http://localhost:4321) together. Ctrl+C stops both.

Open **http://localhost:4321/th/** (or `/en/`). Useful pages: `/th/apis/` (try `?q=ฝุ่น` or
`?category=finance&status=auth_required`), `/th/apis/<id>/` (the playground is on the right), `/th/dashboard/`.

Optional: `npm run health` probes every API once and writes `data/status.json`, which fills in the status
icons and the dashboard trends (they show "unknown" until you do, and again after 72 hours).

Run one half alone with `npm run dev:web` or `npm run dev:worker`. `npm run brand:build` regenerates the
logo, favicon and social images from `brand/logo-source.png`.

### If something does not start

| Symptom | Fix |
|---|---|
| `Node ... is too old` | `nvm install && nvm use` |
| `Port 8788 (worker) is already in use` | `lsof -nP -iTCP:8788 -sTCP:LISTEN` shows what holds it. Stop it, or change the port in `apps/worker/wrangler.toml` (`[dev] port`), `DEV_PORTS` in `scripts/dev.mjs` and `PUBLIC_PLAYGROUND_URL` in `apps/web/.env` |
| Port 4321 in use | Same idea. The Worker only accepts the site origins in `ALLOWED_ORIGINS` (`localhost:4321`, `127.0.0.1:4321`) |
| Playground says it cannot connect | The Worker is not running, or `PUBLIC_PLAYGROUND_URL` does not match its port (restart `npm run dev` after editing `.env`; Astro reads it at start) |
| Status icons all "unknown" | Run `npm run health` |

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
