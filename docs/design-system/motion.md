# Motion

Purposeful and short. Nothing animates to be noticed; everything animates to show cause and effect.

| Interaction | Duration |
|---|---|
| Hover, focus, tab, button | 150 ms |
| Page-to-page fade (native view transitions, no JS) | 200 ms |
| List rows entering (staggered, capped at 8) | 200 ms + 40 ms each |
| Chart entrance (grow / sweep / fade) | 650 ms, 70-90 ms stagger |
| Line draw | 900 ms |
| Number count-up | 800 ms |
| Skeleton shimmer | 1.5 s loop |

- Easing: `cubic-bezier(0.22, 0.8, 0.24, 1)` (ease-out) for entrances, no bounce or elastic.
- Loading shapes match the content: chart-shaped skeletons for charts, row-shaped for the command
  palette, a response-shaped block in the playground. A spinner is only for the Send button.
- Chart animations only start once the chart is in view (`data-in`), and run once.
- `prefers-reduced-motion` shortens every animation to ~0 ms and the count-up jumps to its value.
- Everything is CSS (`globals.css`) except the count-up, which is a short `requestAnimationFrame` loop.
