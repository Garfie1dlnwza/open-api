# Design decisions

Why the home page and the API lists look the way they do. Revisit these when the product changes, not
because a layout looks dated.

## Direction

A modern open-data platform for developers: editorial and calm, with technical identity coming from real
data (a live status board, a real request and response) rather than from decoration. Not a government
portal, and not a gradient-heavy SaaS dashboard.

## Decisions and trade-offs

| Decision | Why | Cost / alternative |
|---|---|---|
| Hero sits on a soft blue band (`brand-50`); content sits on the neutral canvas | Sections were blending: grey page, white boxes, little contrast. A tinted band gives the first screen a distinct plane without adding cards or gradients | One more surface colour to keep in the token set |
| Two-line headline, second line in brand blue | The only typographic accent on the page, so it carries the message; the blue stays tied to action and identity | Splits one sentence across two message keys (Thai and English both) |
| Search is the heaviest control: 56 px, 2 px brand border, hotkey hint inside | It is the first thing a developer does. Everything else on the hero is lighter | None meaningful |
| A real `curl` call and a response excerpt under the search | Shows what the platform is for in one glance, from the most trusted keyless API. Fills the hero's empty lower-left honestly (no stock illustration) | The excerpt is hand-trimmed in the catalog, labelled "excerpt", and must be kept in step with the API |
| Status board leads with "4 of 8 operational" | Readers should not have to count rows. The summary is the headline; rows are detail | Needs a stale-data warning (24 h) so a summary cannot go quietly out of date |
| Uptime strip per row (one bar per check) | Shows history, not just now: a status page idiom developers already read. Missing history is drawn as faint ticks, so "not enough data" is visible | Hidden below 640 px, where there is no room; the icon and label still carry the status |
| A 5 s response counts as Degraded, not Operational | The UI had been honest but the data was not: this repo had set TMD's slow limit to 8 s. The fix is in the catalog, not in the colour | TMD now shows a warning permanently; its `knownIssue` explains why |
| Icon legend under the board and above the list | Icons carry status, source and "needs a key", so each needs naming once. A one-line legend costs less than a word on every row | The legend adds a line; rows stay quiet |
| Rows: left bar, tint and chevron on hover or focus; inset ring on focus | A row that is a link should look like one, with a clear keyboard focus, without turning into a button | A slightly busier hover than plain tint |
| Rows, not cards, for lists | Fifty APIs in rounded boxes read as a template; a ruled list is denser and scans faster | Less room for rich per-item content (it lives on the detail page) |
| Search palette offers recent and suggested APIs when empty | Autocomplete already exists (results as you type); an empty box should not be a dead end. Recents stay in this browser's `localStorage` | Suggested is by trust score, a proxy for "popular" until there is usage data |
| Line chart rather than area for trends | Two measures, one scale, 2 px line with a faint wash only as context | An area chart would suggest volume, which these are not |
| No dark mode yet | Needs a second validated token set and contrast tests, not an inverted palette | Developers often prefer it; a good next step |
