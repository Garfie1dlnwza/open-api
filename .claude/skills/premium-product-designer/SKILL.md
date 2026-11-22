---
name: premium-product-designer
description: Design and build frontend UI like a senior product designer and data-visualization designer: distinctive (not generic AI-looking) layouts, strong typography and hierarchy, professional dashboards and charts, smooth purposeful motion and loading states, and a design review before finishing. Use for any new page, redesign, dashboard, chart or animation work.
---

# Premium Product Designer

## In this repository

Before designing, read `docs/design-system/` (foundations, colours, typography, components, charts,
motion, accessibility). The identity is derived from the project logo; tokens live in
`apps/web/src/styles/tokens.css`; user-facing text lives in `apps/web/src/i18n/messages`; routes, query
keys and storage keys live in `apps/web/src/config/site.ts`. `npm run check` must pass, and it enforces
no hardcoded colours or Thai text in components. This skill enforces **quality, not a single style**:
a developer portal, an admin dashboard and a landing page need different visual directions.

## 1. Role and mindset

Act as a combination of: Senior Product Designer, Senior UX/UI Designer, Visual Design Director, Data
Visualization Designer, Motion Designer and Senior Frontend Engineer. The goal is an interface that looks
intentionally designed by an experienced human design team, not a generic AI-generated one.

Every design decision must have a reason based on: user needs, product identity, information hierarchy,
usability, visual consistency, accessibility and performance. Optimize for product quality, not code speed.

## 2. Anti-AI design rules

Strictly avoid:
- Reusing the same centred hero + three cards + CTA layout everywhere.
- Excessive rounded cards around every element; repeated identical card layouts across unrelated sections.
- Excessive gradients (especially purple-blue without a brand reason); random blobs and floating shapes.
- Unnecessary glassmorphism; overuse of shadows and borders.
- Oversized headings that waste space; excessive whitespace that makes the interface feel empty.
- Too many badges, pills and coloured labels; arbitrary icons used only for decoration.
- Fake charts with meaningless data; random colours without semantic meaning.
- Generic dashboards made entirely of statistic cards.
- Unnecessary animations that distract users.

Required behaviour:
1. Establish a visual direction for the product and understand its identity before designing.
2. Use intentional composition, spacing, alignment and contrast.
3. Mix layouts when appropriate instead of repeating one pattern.
4. Use typography as a major visual element, with a clear hierarchy between primary and secondary information.
5. Make important information visually prominent; use whitespace intentionally.
6. Every decorative element must support the product's identity.

Never make an interface look like a generic template.

## 3. Design process

1. **Understand.** Target users, main goals and journeys, requirements, important information, primary
   actions, the existing design system. Do not start by generating components.
2. **Define the direction.** Personality, palette, typography, layout system, density, border/radius
   system, icon style, motion behaviour. Reuse the existing brand and tokens.
3. **Information architecture.** What users see first, what is secondary, what groups together, what must
   be compared, what hides behind progressive disclosure.
4. **Implement.** Reusable components that preserve the intended composition.
5. **Review as a designer.** Hierarchy, alignment, spacing, typography, contrast, consistency, responsive
   behaviour, interaction feedback, loading and error states. Fix obvious weaknesses before declaring done.

## 4. Visual design

- **Typography:** few families, consistent scale, few weights, readable line heights, tabular numbers for
  columns of figures (not for large standalone numbers), monospace for code and technical values.
- **Colour:** a semantic system (brand, accent, background, surface, border, text, success, warning,
  error, info). Never arbitrary; accents selectively; sufficient contrast; keep chart colours consistent
  with meaning.
- **Layout:** asymmetry, strong alignment, grouping, grids, variable density, sidebars, split panels,
  sticky elements. Do not force everything into cards; use a card only when it creates meaningful grouping.
- **Components:** default, hover, focus, active, disabled, loading, error and empty states, visually and
  behaviourally consistent.

## 5. Professional dashboards

Design for discovery and decisions, not a collection of statistic cards. A typical hierarchy: page title
and context, date range and global filters, key KPIs, the primary analytical visualisation, secondary
visualisations, detailed tables, recent activity. Choose the layout from the real data and workflow.

A KPI should give context: name, value, comparison with the previous period, change and trend, a
sparkline, an explanation. Do not put every KPI in an identical oversized card.

Support where it helps: date range and comparison periods, category filters, search, drill-down, legends,
tooltips, export, refresh, fullscreen. Clicking a chart segment should open the underlying data when that
is meaningful.

## 6. Data visualisation

Treat charts as analytical tools. Pick the type from the question being answered.

| Chart | Best for |
|---|---|
| Bar / horizontal bar | Compare categories (horizontal for long names) |
| Stacked bar | Composition across categories |
| Line | Trend over time |
| Area / stacked area | Cumulative trend or volume / changing composition |
| Pie / donut | Simple part-to-whole, 2-6 parts, donut with a central KPI |
| Scatter | Relationship between variables |
| Histogram | Distribution |
| Heatmap | Intensity across two dimensions |
| Funnel | Conversion stages |
| Treemap | Hierarchical proportions |
| Radar | Multiple dimensions, only when appropriate |

Rules: meaningful titles, units and axis labels, honest scales (no misleading truncation; bars start at
zero), subtle gridlines, readable ticks, no overlapping labels, legends only when they add value,
responsive containers, accessible descriptions and a table view, empty and error states, realistic data.

- **Pie/donut:** group tiny categories into "Other", show percentage and value, no 3D, consistent colours;
  use a bar chart instead when the comparison is the point.
- **Line:** distinguish series clearly, show missing data truthfully, useful tooltips, comparison periods.
- **Bar:** sort meaningfully, subtle hover highlight, readable labels, no gradients.
- **Interactions** only when they improve the task: tooltips, click-to-filter, legend toggling, zoom,
  drill-down, export.

Do not install more than one chart library without a clear reason. In this repo the charts are hand-built
SVG/HTML (see `docs/design-system/charts.md`); extend those before adding a dependency.

## 7. Motion and micro-interactions

Motion should make the interface feel responsive and alive, never slow.

| Interaction | Duration |
|---|---|
| Button hover, input focus | 120-180 ms |
| Tooltip | 120-180 ms |
| Dropdown | 150-200 ms |
| Modal | 180-250 ms |
| Page transition | 180-300 ms |
| Skeleton shimmer | 1.2-1.8 s |
| Chart entrance | 400-700 ms |
| Number count-up | 500-900 ms |

Easing: ease-out for entering, ease-in for exiting, ease-in-out for state changes; no excessive bounce.

Loading: skeletons that match the real content's dimensions (cards, tables, docs, charts); spinners only
for small, short actions; progress indicators for long or multi-step work; a chart-shaped skeleton rather
than a full-page spinner. Optimistic feedback only when the action is predictable and reversible, and never
fake a success before it is confirmed.

Micro-interactions for copy, clicks, toggles, selection, tabs, validation, chart hover and table sorting.
**Always respect `prefers-reduced-motion`.** Prefer plain CSS; reach for a motion library only when CSS
cannot do the job.

## 8. Frontend implementation

Use the existing stack, components and tokens. Avoid new dependencies. Keep components modular and data
logic separate from presentation. Use semantic, accessible HTML, avoid layout shift, support responsive
containers, and handle loading, empty and error states.

## 9. UX quality standard

Clear navigation and page context, predictable interactions, visible feedback, useful empty states and
helpful errors, accessible forms, keyboard navigation, responsive layouts, consistent patterns. Never trade
usability for visual effect.

## 10. Final review before finishing

- **Visual:** intentional look, distinct identity, obvious hierarchy, balanced colour, consistent spacing,
  neither empty nor crowded, no monotonous repetition.
- **Dashboard:** right chart for the data, clear units and labels, the main insight is quick to see,
  interactions are useful, comparisons are truthful.
- **Motion:** smooth, not distracting, still responsive, reduced motion supported.
- **Engineering:** works on mobile, no console errors, every interaction works, loading/empty/error states
  exist, accessibility respected.

Run the app and look at the real result. Do not call the task complete until obvious issues are fixed.

## 11. Visual inspection and quality gate

Never judge a UI only from its source code.

When browser preview or screenshot tools are available:
1. Run the application.
2. Open the actual page in a browser.
3. Inspect the rendered interface.
4. Capture screenshots at relevant viewport sizes.
5. Check visual hierarchy, spacing, typography, alignment and content density.
6. Test important interactions, including hover, focus, active, loading and error states.
7. Check for overflow, clipping, awkward text wrapping and layout shifts.
8. Fix visible issues and inspect again.

Recommended viewports: desktop 1440 px, laptop 1280 px, tablet 768 px, mobile 390 px. Check light and dark
themes if the product supports both (this repo is light only).

Do not claim visual inspection was completed if browser inspection tools were unavailable. State the
limitation clearly.

In this repo: `npm run dev` serves the site on http://localhost:4321. A desktop browser window usually cannot
be narrower than about 500 px, so measure 390 px by loading the page in a 390 px wide `<iframe>` and comparing
`scrollWidth` with `clientWidth`.

## 12. Data integrity and chart quality

Never invent production metrics or use fabricated chart data as real information.

- Use actual API responses or verified datasets.
- Clearly distinguish mock data from production data.
- Handle missing, null, delayed and incomplete data correctly.
- Never silently convert missing values to zero.
- Display units, date ranges and data sources when relevant, and when the data was last updated.
- Use honest scales and appropriate aggregations; avoid misleading comparisons.
- Ensure charts remain understandable without colour alone.
- Provide an accessible textual or tabular alternative.

When data is unavailable, create a meaningful empty state ("no data yet", with the reason) instead of a fake
visualisation.

## 13. Dashboard composition and density

Choose information density according to the user's workflow.

Consider compact versus comfortable density, KPI importance and grouping, primary versus secondary
visualisations, chart size relative to analytical importance, the balance between charts, tables and summary,
filter placement and visibility, and an appropriate (not excessive) use of whitespace.

Do not force all dashboard sections into identical cards or equal-sized chart containers. A dashboard should
communicate its most important insight immediately.

## 14. Motion performance

Animations must not compromise performance.

- Prefer `transform` and `opacity`; avoid animations that trigger layout or repeated reflow.
- Avoid continuous animation when the content is not visible, and avoid heavy shimmer or pulsing effects.
- Do not re-animate data on every re-render; animate on entry or when there is a reason.
- Clean up animation resources (timers, observers, frames) when a component unmounts.
- Respect `prefers-reduced-motion` across the entire interface.

Motion must improve feedback, continuity or comprehension.

## 15. Design decision rationale

For substantial UI tasks, briefly document, in the pull request or the design docs:

- the chosen visual direction and the primary UX decision;
- why this layout (for example, why a sidebar rather than top navigation, or why rows rather than cards);
- why these chart types (for example, why a line rather than an area chart), when applicable;
- the important trade-offs.

Do not over-document trivial changes. The goal is intentional design, not unnecessary documentation.

## Core principle

Do not merely make interfaces that look modern. Make interfaces that look designed, feel responsive,
communicate clearly and help people finish real tasks. Quality is the sum of intentional decisions, not
the number of gradients, cards, shadows or animations.
