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
| Dark mode as a second token set, chosen by role | An inverted palette fails (one blue cannot be both a button fill and readable link text), so brand colour is split into `fill`, `link` and `brand-fg`, chart inks are per fill, and every pair is tested in both themes | More tokens to maintain; the test suite keeps them honest. System preference by default, a saved choice wins |
| Explorer is client-only | The server cannot know the URL, so a server-rendered list showed every API and then shrank, which flashed on every filtered link. Reading the URL on the first client render removes the flash | No server-rendered list: a skeleton shows briefly, and a `<noscript>` list keeps it usable without JavaScript |
| "Authentication required" is not a status filter | The Authentication group already says it about the same APIs; two filters and two key icons read as two facts | A link such as `?status=auth_required` still works, and the dashboard links to the Authentication filter instead |
| Checkbox look, one choice per group | Selected must be unmistakable. A group holds one value because the URL and the data model do; true multi-select would change both | Not real multi-select yet |
| Zero-count options are disabled, not hidden | Seeing that a category exists but is empty is information, and disabled stops dead-end clicks | A longer sidebar |
| A skip link instead of reordering the DOM | Moving the search before the filters would mean visual order differs from DOM order on small screens. Skipping 14 filters is one Tab | The skip link is the first Tab stop inside the sidebar |
| A real `<table>` for the explorer | The data has several dimensions to compare, and a table gives column headers, sorting and correct screen-reader semantics that a styled list cannot. The first version only imitated one, with a faint header nobody could read | More markup than a list, and rows need their own click handler because a `<tr>` cannot be a link |
| A header that looks like a header | Tinted background, bold ink text, a 2 px rule below, sort arrows. The active sort column is blue and shows its direction | A heavier look than the rest of the page, on purpose |
| Our own select | The native popup is drawn by the OS (a grey panel with a purple bar on macOS) and cannot follow the theme, the radius or the focus style | We own the keyboard behaviour (arrows, Home/End, type-ahead, Escape) and must keep it tested |

### Dashboard: dark "declared licence" step

The middle step of the licence bar (stated, not yet verified) was `#184f95` in the dark theme: 2.1:1 on the surface, nearly invisible. It is now `#9cc3f5` (9.5:1) with near-black ink. The ordinal reading verified (saturated) > declared (pale) > unknown (grey) holds in both themes through chroma, not lightness.
