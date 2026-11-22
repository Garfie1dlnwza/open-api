# Foundations

Reliable, open, technical, friendly. Quiet on the surface, dense where it matters: readable data,
fast search, and an API you can try without learning a tool first.

## Identity

The palette and the mark come from the project logo (`brand/logo-source.png`): an elephant in blue,
green and red inside a circuit ring. `npm run brand:build` derives every image from that one file.

- **Blue** is the product colour (links, active states, primary actions).
- **Red** appears only as the Thai flag hairline above the header, the wordmark and its one-off
  accents. Red text uses a darker `red-fg`. Red never means "error": errors use the status red.
- **Green** from the logo is a UI accent. Charts use a different green because the logo green fails
  colour-blind separation against orange (measured: dE 2.7).
- The **flag hairline** (red / white / blue x2 / white / red, in the real flag's proportions) is the
  one deliberate brand device. Everything else stays plain.

## What we avoid, on purpose

A generic "AI template" has a recognisable look. We chose against each part of it:

| Template habit | What we do instead |
|---|---|
| Centred hero, then three feature cards | Asymmetric hero: copy and search on the left, a **live status board with real data** on the right |
| Every item in a rounded, shadowed card | Items are rows in one ruled list (hairline dividers). Boxes only where grouping is real (endpoints, the playground) |
| Pills and badges for every attribute | Status, source and "needs a key" are **icons** with an accessible name and tooltip. Words appear where a page leads with them |
| Gradients, glass, blobs | Flat surfaces, hairlines, no decoration that carries no meaning |
| Fake statistics | Every number is computed from the catalog or the probe history; with no data the chart says so |

Icons stand in for words only when the shape itself differs (check, triangle, cross, question, key),
the meaning is in `aria-label` and `title`, and a filter list with real words sits next to them.

## Layout

Header 60 px, sidebar 232 px, content max 1200 px, detail column 760 px, playground 420 px. The detail
page widens to 1480 px so all three columns fit. Radius 4 / 6 / 8 / 12 px: tight, not bubbly. Only
floating layers (tooltips, dialogs) have a shadow. Spacing is Tailwind's 4 px scale.

## Motion

See [motion.md](motion.md).
