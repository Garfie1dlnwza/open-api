# Colour

Defined once in `apps/web/src/styles/tokens.css`; Tailwind names come from `globals.css`.

| Role | Tokens |
|---|---|
| Brand blue (logo blue is `brand-700`) | `brand-900/800/700/500/100/50` |
| Logo red (hairline, wordmark) | `flag`, and `flag-fg` for text |
| Logo green (UI accent) | `accent-800/700/100/50` |
| Surfaces | `canvas`, `surface`, `subtle` |
| Text | `ink`, `ink-2` (secondary), `ink-3` (muted) |
| Borders | `line` (decorative), `line-strong`, `control` (inputs/buttons, >= 3:1) |
| Status text on tint | `success|warning|error|info|quiet` `-fg` on `-bg` |
| Status icons | `success|warning|error|info` `-dot` |
| Charts | `series-1/2/3`, `series-1-light`, `series-other`, `status-*`, `gridline`, `axis`, `chart-label`, `on-series`, `on-dark` |

`contrast.test.ts` checks every pair we use against WCAG AA. It has already changed the proposals:

- Muted text `#94A3B8` is 2.6:1 on white; `ink-3` is darker and passes 4.5:1.
- Success, warning and error colours fail as text on white, so tinted badges use dark `-fg` and the
  original hues are kept for icons and chart marks.
- Labels printed inside chart fills use white only where it reaches 4.5:1 (blue, red); orange, aqua,
  green and grey take near-black (`on-dark`).
- The light border `#E2E8F0` is decorative; input borders use `control` (>= 3:1).

## Chart palette (validated)

Series order is fixed: **blue `#0053B1`, orange `#EB6834`, aqua `#1BAF7A`**. Validated with the dataviz
script on a white surface: lightness band, chroma floor, adjacent colour-blind distance (worst dE 9.2,
target 8) and normal-vision distance (27.6, floor 15) all pass. The one WARN is aqua at 2.8:1 against
white, which obliges a relief channel: every chart prints its figures in the legend and has a table
view, so no value depends on seeing aqua.

The logo's own green `#0F8F4D` was tried and **fails** (orange vs green dE 2.7 under protanopia), which
is why charts do not use it.

Status colours are reserved for meaning (good, warning, critical, authentication) and always ship with
an icon and a label.

## Dark theme

The site follows the OS until the visitor presses the toggle in the header; the choice is kept in
`localStorage`. A tiny inline script in `BaseLayout.astro` sets `data-theme` on `<html>` before the first
paint (no flash of the wrong theme), and `tokens.css` redefines the tokens under
`:root[data-theme="dark"]`. Components never branch on the theme; they only use tokens.

Because one blue cannot be both a button fill (white text on it) and readable link text on a dark page,
brand colour is used by **role**:

| Role token | Use |
|---|---|
| `fill`, `fill-hover` | Primary button and other filled blue surfaces (white text) |
| `link` | Link text, active tab and nav underline, focus accents |
| `brand-fg` | Text on a brand tint (`brand-50` / `brand-100`) |
| `flag-blue` | The centre of the flag hairline |

Do not reach for `brand-700` or `brand-800` for text or accents.

Label colours printed on chart fills are per fill (`on-good`, `on-critical`, `on-series-1`, ...), because
the right ink flips with the fill: the blue series needs white text in light and near-black in dark.

Chart series in dark use the dark steps of the validated palette (`#3987E5`, `#D95926`, `#199E70`),
re-validated with the dataviz script against the dark surface `#111A2E`: lightness band, chroma, adjacent
colour-blind distance (worst dE 9.4) and contrast (>= 3:1 for all three, better than light mode, where the
third series needs the legend and table as relief).

`contrast.test.ts` runs every text and UI pair against **both** themes, and fails if the dark theme
overrides a token that does not exist in the light one.
