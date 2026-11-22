# Thai Open API

A catalog of Thailand's public APIs with live status, a playground and a dashboard. Monorepo:
`catalog/` (YAML), `packages/schema` (shared Zod schema and logic), `apps/web` (Astro + React islands),
`apps/worker` (Cloudflare Worker playground proxy). Start with `README.md` and `docs/architecture.md`.

## Commands

- `npm run check` runs catalog validation, typecheck (including `astro check`), ESLint, the hardcoded-values
  check, the duplication check and all tests. **Run it before finishing any task.**
- `npm run dev` starts the playground Worker (8788) and the site (4321) together; `npm run build` builds the site. `npm run health` probes every API and writes `data/status.json`.
- Astro 7 needs **Node 22.23.4 or newer** (`.nvmrc`). Older Node fails at startup.

## Conventions

- **No hardcoding, no duplication.** User-facing text goes through `t()` and `apps/web/src/i18n/messages`
  (Thai and English, both required). Colours come from `apps/web/src/styles/tokens.css`; routes, query keys,
  storage keys and limits from `apps/web/src/config/site.ts` or `packages/schema/src/constants.ts`.
  `scripts/check-hardcoded.mjs` and `jscpd` enforce this.
- **Security-sensitive code** (`apps/worker`, `packages/schema/src/{url,params,upstream,playground,host}.ts`):
  the Worker accepts catalog IDs only, never URLs. Keep that property, and add a test for every new guard.
- **Colour roles.** Use `bg-fill`, `text-link`, `text-brand-fg` and the status/chart tokens, never raw brand steps
  (`brand-700`/`800`) for text or accents: the dark theme depends on it. Contrast is tested in both themes.
- **Honest data.** Never fabricate metrics, statuses or licence information. `license.verified` is true only
  after a human read the terms.
- **Git.** Branch from `develop` (`feat/*`, `fix/*`), merge into `develop`; `main` only receives releases.
  Commits follow Conventional Commits (`type(scope): summary`). Commits are authored by the repository
  owner alone: do not add `Co-Authored-By` trailers or "generated with" lines.

## Mandatory design quality gate

For every frontend task:

1. Read the `premium-product-designer` skill (`.claude/skills/premium-product-designer/SKILL.md`) and
   `docs/design-system/`.
2. Inspect existing pages before creating new UI.
3. Never use generic template layouts without considering alternatives.
4. Do not use placeholder charts or fabricated metrics in production.
5. Every chart must have a clear analytical purpose.
6. Implement loading, empty, error and success states.
7. Test responsive layouts.
8. Run the application and visually inspect the result.
9. Fix visual issues before completing the task.

A page is not complete just because it compiles. It must also meet the product's UX and visual quality
standards.
