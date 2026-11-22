import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const token = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(token[a]), luminance(token[b])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AA_TEXT = 4.5;
const AA_UI = 3;

const textPairs: [string, string][] = [
  ["ink", "canvas"], ["ink", "surface"], ["ink", "subtle"],
  ["ink-2", "canvas"], ["ink-2", "surface"], ["ink-2", "subtle"],
  ["ink-3", "canvas"], ["ink-3", "surface"], ["ink-3", "subtle"],
  ["brand-700", "surface"], ["brand-700", "canvas"], ["brand-700", "brand-100"],
  ["brand-800", "brand-100"], ["on-brand", "brand-800"], ["on-brand", "brand-900"],
  ["accent-800", "surface"], ["accent-800", "accent-50"], ["accent-800", "accent-100"],
  ["success-fg", "success-bg"], ["warning-fg", "warning-bg"], ["error-fg", "error-bg"],
  ["info-fg", "info-bg"], ["quiet-fg", "quiet-bg"],
  ["code-fg", "code-bg"], ["code-muted", "code-bg"],
];

describe("design tokens meet WCAG AA", () => {
  it.each(textPairs)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each([["brand-500", "canvas"], ["brand-500", "surface"], ["success-dot", "surface"], ["warning-dot", "surface"], ["error-dot", "surface"], ["info-dot", "surface"], ["control-border", "surface"], ["control-border", "canvas"]])(
    "UI colour %s on %s is at least 3:1",
    (fg, bg) => {
      expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA_UI);
    },
  );
});
