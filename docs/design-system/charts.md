# Charts

Hand-built SVG/HTML, no chart library: five chart types is less code than the dependency, matches the
tokens exactly and keeps the bundle small. Each chart answers one question, which is written under its
title. All data comes from `lib/dashboard.ts`, computed from the catalog and `status.json` (tested);
nothing is sample data.

| Question | Form | Why |
|---|---|---|
| Is availability moving? Is it getting slower? | Line (time on x, starts at zero) | Trend over time |
| Where do all endpoints stand right now? | Tall segmented bar, status colours | One whole in <= 5 parts |
| Agencies or community? | Donut with the total in the centre | Part-to-whole, 3 parts |
| Which category has the most APIs? | Ranked horizontal bars, one hue | Compare magnitudes, long labels |
| Which APIs fail most? | Ranked horizontal bars, status red, with the API's icon | Ranking |
| How complete is our licence review? | Segmented bar, one hue in three steps | Ordered states |

## Rules we follow

- Marks are thin: bars 10 px with a 4 px rounded data end, lines 2 px, markers 8 px with a 2 px ring in
  the surface colour, segments separated by a 2 px gap (never a stroke). Grid and axes are solid hairlines.
- One axis only. No dual-axis charts.
- Colour follows the entity: official is always blue, community orange, unofficial aqua. A filter never
  recolours the survivors.
- A legend (with the figures) whenever there are two or more parts; direct labels only where they fit.
  Text never wears a series colour: swatches carry identity.
- Every chart has a tooltip on hover **and** keyboard focus, a drill-down link into the explorer where
  one makes sense, and a "view as table" twin with the same numbers.
- With fewer than two probe runs there is no trend: the chart says how many runs exist instead of
  drawing a line through nothing.

## Loading

The dashboard islands are `client:only`, so the real loading state is a chart-shaped skeleton
(`DashboardSkeleton.astro`) with the same layout and heights, which prevents layout shift. Charts
animate in when they scroll into view (bars grow, lines draw, donut arcs sweep, numbers count up).
