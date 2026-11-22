# Components

| Component | File | Notes |
|---|---|---|
| StatusBadge | `components/api/StatusBadge.tsx` | Icon + word for 5 statuses |
| TrustBadge / LicenseBadge | `components/api/TrustBadge.tsx` | Provenance, kept apart from status |
| TrustScore | `components/api/TrustScore.tsx` | Breakdown; bar colour follows each factor |
| ApiCard | `components/api/ApiCard.tsx` | Name, provider, status, one description, source, category, auth, verified |
| CategoryChip | `components/api/CategoryChip.tsx` | Link on home, toggle in the explorer |
| ApiExplorer | `components/api/ApiExplorer.tsx` | URL-backed filters, facet counts, empty state with Clear |
| SearchCommand | `components/SearchCommand.tsx` | ⌘K; index loaded on first open |
| EndpointCard / ParameterTable | `components/api/` | Tabs keep all panels in the DOM |
| CodeBlock / CodeTabs | `components/playground`, `components/api` | Copy with confirmation |
| ApiPlayground / ResponseViewer | `components/playground/` | Request/response split, mobile tabs, key consent dialog |
| Button, Field, Tabs, Dialog, EmptyState | `components/ui/` | Primitives |

Astro pages cannot pass JSX as a prop to a React component; pass data, and let the component
choose its icon (see `LinkButton external` and `CategoryChip category`).
