/** Stable React keys for table rows that may repeat (two checks in the same minute print the same cells). */
export function rowKeys(rows: (string | number)[][]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = row.join("|");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}#${n}`;
  });
}
