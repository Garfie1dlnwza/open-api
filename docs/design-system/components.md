# Components

| Component | File | Notes |
|---|---|---|
| StatusBadge | `components/api/StatusBadge.tsx` | `icon` (default, dense lists) or `pill` (page headers) |
| TrustBadge / LicenseBadge | `components/api/TrustBadge.tsx` | Source as icon or icon + text; kept apart from status |
| TrustScore | `components/api/TrustScore.tsx` | Ruled breakdown; each bar is coloured by its own state |
| ApiRow | `components/api/ApiRow.tsx` | One API as one line: status, name, provider, description, source, key, date |
| FacetOption | `components/api/FacetOption.tsx` | Filter row: icon, name, result count |
| ApiExplorer | `components/api/ApiExplorer.tsx` | URL-backed filters, facet counts, empty state with Clear |
| SearchCommand | `components/SearchCommand.tsx` | Cmd/Ctrl K; index loaded on first open, skeleton while loading |
| EndpointCard / ParameterTable | `components/api/` | Tabs keep all panels in the DOM |
| CodeBlock / CodeTabs | `components/playground`, `components/api` | Copy with confirmation |
| ApiPlayground / ResponseViewer | `components/playground/` | Request/response split, mobile tabs, key consent dialog, spinner and skeleton |
| ChartCard | `components/charts/ChartCard.tsx` | A hairline-topped slot with the question the chart answers and a table view |
| BarList, DonutChart, LineChart, SegmentedBar, Sparkline, StatTile | `components/charts/` | See [charts.md](charts.md) |
| Button, Field, Tabs, Dialog, EmptyState, Skeleton | `components/ui/` | Primitives |

Astro pages cannot pass JSX as a prop to a React component; pass data, and let the component choose
its icon (see `LinkButton external`, `StatusBadge status`).
