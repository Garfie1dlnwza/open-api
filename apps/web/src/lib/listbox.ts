/** Pure keyboard rules for a select-only listbox (the ARIA "select-only combobox" pattern), so they can be tested. */

/** Where the highlighted option moves for a navigation key, or null if the key is not one. */
export function moveActive(key: string, active: number, count: number): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  switch (key) {
    case "ArrowDown": return Math.min(active + 1, last);
    case "ArrowUp": return Math.max(active - 1, 0);
    case "Home": return 0;
    case "End": return last;
    case "PageDown": return Math.min(active + 10, last);
    case "PageUp": return Math.max(active - 10, 0);
    default: return null;
  }
}

/**
 * Type-ahead: the next option, after `from`, whose label starts with what was typed. Typing the same letter
 * repeatedly cycles through the options that start with it. Returns -1 when nothing matches.
 */
export function typeAhead(labels: string[], typed: string, from: number): number {
  if (!typed) return -1;
  const needle = typed.toLowerCase();
  const cycling = [...needle].every((c) => c === needle[0]);
  const prefix = cycling ? needle[0] : needle;
  const order = labels.map((_, i) => (from + (cycling ? 1 : 0) + i) % labels.length);
  return order.find((i) => labels[i].toLowerCase().startsWith(prefix)) ?? -1;
}
