export interface TipContent {
  title?: string;
  rows: { swatch?: string; label: string; value: string }[];
}
export interface TipState {
  x: number;
  y: number;
  content: TipContent;
}

const EDGE = 96;

/** Floating readout. Values lead and names follow; rows are keyed with a short stroke of the series colour. */
export function ChartTooltip({ tip, width }: { tip: TipState | null; width: number }) {
  if (!tip) return null;
  const left = Math.min(Math.max(tip.x, EDGE), Math.max(width - EDGE, EDGE));
  return (
    <div role="tooltip" className="chart-tip pointer-events-none absolute z-10 w-max min-w-32 max-w-[calc(100vw-2rem)] whitespace-nowrap rounded-md bg-ink px-3 py-2 text-on-brand shadow-pop" style={{ left, top: tip.y, transform: "translate(-50%, calc(-100% - 10px))" }}>
      {tip.content.title && <p className="mb-1 text-caption opacity-80">{tip.content.title}</p>}
      <ul className="flex flex-col gap-1">
        {tip.content.rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-small">
            {row.swatch && <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: row.swatch }} />}
            <strong className="font-semibold tabular-nums">{row.value}</strong>
            <span className="opacity-80">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
