# Release process

```
feat/* ──PR──► develop ──PR (merge commit)──► main ──► release PR ──► tag + GitHub Release
```

1. Work on `feat/*` or `fix/*` branches cut from `develop`; open PRs into `develop`. CI must pass.
2. When `develop` is ready to ship, open a PR **develop → main** and merge it with a *merge commit*
   (not squash) so the conventional commit messages reach `main`.
3. On every push to `main`, the **Release** workflow (release-please) opens or updates a release PR
   that bumps `package.json`, updates `CHANGELOG.md` and proposes the next version.
4. Merging the release PR creates the git tag and a GitHub Release.
5. Pushes to `main` also run **Deploy** (when `DEPLOY_ENABLED=true`): build, deploy the Worker, then
   the site to Cloudflare Pages.
6. After a release, merge `main` back into `develop` so the version bump and changelog are on both.

Hotfixes: branch from `main` as `fix/*`, PR into `main`, then merge `main` into `develop`.

## One-time setup

Repository **variables**: `DEPLOY_ENABLED=true`, `PUBLIC_SITE_URL`, `PUBLIC_PLAYGROUND_URL`,
`CF_PAGES_PROJECT`. **Secrets**: `CLOUDFLARE_API_TOKEN` (Pages + Workers edit),
`CLOUDFLARE_ACCOUNT_ID`. Create a `production` environment if you want approval gates.

**Required:** Settings → Environments → `production` → *Deployment branches and tags* → restrict to
`main`. Without it, anyone with write access could run the Deploy workflow from another branch with a
modified workflow file and reach the Cloudflare secrets. Store the secrets on that environment (not
repo-wide) and scope the API token to this Pages project and Worker only.

Branch protection (recommended): require the **CI** checks on `develop` and `main`, block force
pushes, and restrict who can push to `main`. Settings → Actions → General → allow GitHub Actions to
create pull requests, which release-please needs. Releases opened with the default token do not
trigger CI on the release PR; use a fine-grained token in `release.yml` if you want that.

## Dependency audits

Pull requests that change `package.json` or `package-lock.json` must pass `npm audit --audit-level=high`.
PRs that do not touch dependencies skip it, so a new advisory never blocks unrelated work. The weekly
**Dependency audit** workflow re-checks `main` and tells you about advisories published later.

## Versioning

Pre-1.0: `feat` bumps the minor, `fix` the patch. `feat!`/`BREAKING CHANGE` also bumps the minor until 1.0.
