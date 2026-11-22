# Security policy

Please report vulnerabilities privately through GitHub's **Report a vulnerability** button on the
Security tab of this repository, not in a public issue.

The most sensitive surface is the playground Worker (`apps/worker`). It accepts catalog IDs only,
never URLs, and enforces per-hop redirect checks, response size caps and an origin allowlist.
Reports about bypassing any of those are especially welcome.
