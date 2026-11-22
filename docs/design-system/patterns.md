# Patterns

- **Home:** copy and a search box (a plain GET form, so it works without JS) beside a live status
  board built from the latest probe, then a category strip with counts, featured APIs as ruled rows,
  a "recently reviewed" timeline and a one-line contribute row.
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
