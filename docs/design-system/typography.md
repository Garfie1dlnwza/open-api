# Typography

IBM Plex Sans Thai for Thai and Latin text, IBM Plex Mono for code. Both self-hosted through
`@fontsource`. Fallback: Noto Sans Thai, system sans.

| Token | Size / weight |
|---|---|
| display | 40 / 700 |
| h1 | 32 / 700 |
| h2 | 24 / 600 |
| h3 | 20 / 600 |
| h4 | 16 / 600 |
| body | 16 / 400 |
| small | 14 / 400 |
| caption | 12 / 400 |
| code | 13 / 400 |

- Body line-height 1.6, headings 1.3: Thai tone marks need a taller line box than Latin.
- **Numbers.** Large standalone figures (the availability hero at 56 px, KPI tiles) use proportional
  digits. `tabular-nums` is only for numbers that line up in columns: table rows, axis ticks, counts in
  lists and legends.
- Headings are tight (`tracking-tight`); small caps-style labels (`uppercase`, `tracking-wide`) are used
  only for facet group titles.
