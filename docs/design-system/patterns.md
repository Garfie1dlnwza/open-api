# Patterns

- **Home:** copy, a search box (a plain GET form, so it works without JS) and three real filter
  shortcuts with counts, beside a live status board. The board leads with a summary ("5 of 8
  operational"), the number of problems and when the probe ran, and warns when that data is older than
  24 hours. Each row shows an icon and a latency, and a latency over 2 s gets an hourglass and a warning
  colour. With no health data it explains where status comes from instead of showing nothing. Below:
  a one-line category row, featured APIs as ruled rows (names may wrap to two lines, never an
  ellipsis), a "recently reviewed" timeline only when review dates differ, and a one-line contribute row.
- **Header:** the one-row menu appears from 1024 px; below that it is a second, scrollable row, so
  nothing is pushed off-screen at 768 px.
- **Dashboard:** hero availability figure, four KPI tiles, then seven charts that each answer one
  question (see [charts.md](charts.md)). Filters would sit in a single row above the charts; with a
  history this short there is no date filter yet.
- **Explorer:** filters live in the URL (`?q=&category=&source=&auth=&status=&sort=`) so Back from a
  detail page restores the view. Facet counts ignore their own facet, so an option never promises
  results that are not there. An empty result names the active filters and offers Clear.
- **Detail:** overview → provider and trust → base URL → authentication → quick start → endpoints
  (parameters and response in tabs) → licence → changelog. Playground sticks to the right at ≥ 1280 px.
- **Playground:** request and response are separate; shows status, time and size; Pretty/Raw; Copy
  response and Copy cURL; a keyed API asks for consent once per tab before a key leaves the browser;
  keys live in the tab unless "remember" is ticked.
- **Responsive:** ≥ 1280 three columns, 1024 two, 768 collapsible sidebar, ≤ 767 single column with
  Request/Response tabs in the playground.
