const PERCENT = 100;

/**
 * Whole-number percentages that always add up to 100 (largest-remainder method), so a legend never
 * reads 33 + 33 + 33 or 38 + 38 + 25. Zero parts stay at 0; an all-zero input gives all zeros.
 */
export function sharePercents(values: number[]): number[] {
  const total = values.reduce((n, v) => n + v, 0);
  if (total <= 0) return values.map(() => 0);
  const exact = values.map((v) => (v / total) * PERCENT);
  const floors = exact.map(Math.floor);
  let spare = PERCENT - floors.reduce((n, v) => n + v, 0);
  const byRemainder = exact.map((x, i) => ({ i, rest: x - floors[i] })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of byRemainder) {
    if (spare <= 0) break;
    if (values[i] > 0) {
      floors[i]++;
      spare--;
    }
  }
  return floors;
}
