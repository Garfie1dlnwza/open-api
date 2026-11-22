# Foundations

Reliable, open, technical, friendly. Simple on the surface, dense where it matters: readable data,
fast search, and an API you can try without learning the tool first.

**Avoid:** full-page gradients, cards inside cards, many saturated colours without meaning, badge
overload, long sidebars, walls of unstructured API text.

- Radius 8–12 px, subtle borders, minimal shadow, Lucide icons.
- Spacing is a 4 px scale (Tailwind's default).
- Layout: header 64 px, sidebar 248 px, content max 1200 px, detail column 760 px, playground
  420 px. The detail page widens to 1480 px so all three columns fit.
- Everything is token-driven: see `apps/web/src/styles/tokens.css`.
- Motion: 150–200 ms ease, colour changes only; `prefers-reduced-motion` disables it.
