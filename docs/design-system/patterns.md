# Patterns

- **Home:** copy, a search box (a plain GET form, so it works without JS) and three real filter
  shortcuts with counts, beside a live status board. The board leads with a summary ("5 of 8
  operational"), the number of problems and when the probe ran, and warns when that data is older than
  24 hours. Each row shows an icon and a latency, and a latency over 2 s gets an hourglass and a warning
  colour. With no health data it explains where status comes from instead of showing nothing. Below:
  a one-line category row, featured APIs as ruled rows (names may wrap to two lines, never an
  ellipsis), a "recently reviewed" timeline only when review dates differ, and a one-line contribute row.
- **Legend and history:** icons are named once, in a one-line legend (under the status board, above the
  explorer list). Each status row has an uptime strip of recent probes. Rows lift on hover and focus.
  The command palette shows recent and suggested APIs while empty. Reasons: [decisions.md](decisions.md).
- **Theme:** light and dark, system by default, switchable from the header and remembered. Charts, code
  blocks and the status board all use tokens, so nothing needs a per-theme override.
- **Header:** the one-row menu appears from 1024 px; below that it is a second, scrollable row, so
  nothing is pushed off-screen at 768 px.
- **Dashboard:** hero availability figure, four KPI tiles, then seven charts that each answer one
  question (see [charts.md](charts.md)). Filters would sit in a single row above the charts; with a
  history this short there is no date filter yet.
- **Explorer:** filters live in the URL (`?q=&category=&source=&auth=&status=&sort=`) so Back from a detail
  page restores the view, and the page is client-only, reading the URL on its very first render so a filtered
  link never flashes the full list (a skeleton shows meanwhile; `<noscript>` lists every API).
  Filter groups are collapsible, each option is a checkbox with an icon, a name and a result count, and an
  option that would show nothing is disabled but still listed. The sidebar sticks, scrolls on its own on short
  screens, and starts with a skip link and a "clear filters" button. Active filters (including the search text)
  are removable chips. An empty result names its cause ("No results for “zzz” in Finance") and offers clear
  search, clear filters or clear all. Column labels sit above the list from 1280 px, where rows have four
  columns; below that the description moves under the name. The key icon appears on a row only when the
  status is not already "authentication required".
- **Detail:** overview → provider and trust → base URL → authentication → quick start → endpoints
  (parameters and response in tabs) → licence → changelog. Playground sticks to the right at ≥ 1280 px.
- **Playground:** request and response are separate; shows status, time and size; Pretty/Raw; Copy
  response and Copy cURL; a keyed API asks for consent once per tab before a key leaves the browser;
  keys live in the tab unless "remember" is ticked.
- **Responsive:** ≥ 1280 three columns, 1024 two, 768 collapsible sidebar, ≤ 767 single column with
  Request/Response tabs in the playground.
