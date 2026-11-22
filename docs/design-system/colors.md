# Colour

Defined once in `apps/web/src/styles/tokens.css`; Tailwind names come from `globals.css`.

| Role | Tokens |
|---|---|
| Brand (primary actions, active nav, links) | `brand-900/800/700/500/100` |
| Accent (decorative; text uses `accent-800`) | `accent-800/600/100/50` |
| Surfaces | `canvas`, `surface`, `subtle` |
| Text | `ink`, `ink-2` (secondary), `ink-3` (muted) |
| Borders | `line` (decorative), `line-strong`, `control` (inputs/buttons, ≥ 3:1) |
| Status text on tint | `success|warning|error|info|quiet` `-fg` on `-bg` |
| Status icons and bars | `success|warning|error|info` `-dot` |

## Deviations from the first proposal

`apps/web/src/styles/contrast.test.ts` checks WCAG AA on every pair we use, and it changed three things:

- Muted text `#94A3B8` is only 2.6:1 on white, so `ink-3` is `#5F6E84` (≥ 4.5:1).
- Success, warning and error colours fail as text on white, so badges use dark `-fg` on a tint and the
  original hues are kept for icons and bars only.
- The light border `#E2E8F0` is decorative; input borders use `control` (`#7B8AA0`, ≥ 3:1).

Never use colour alone for status: every status shows an icon and a word.
