import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const DARK_BLOCK = ':root[data-theme="dark"]';
const [lightCss, darkCss] = [css.slice(0, css.indexOf(DARK_BLOCK)), css.slice(css.indexOf(DARK_BLOCK))];
const parse = (text: string): Record<string, string> =>
  Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));

const light = parse(lightCss);
// The dark theme overrides some tokens and inherits the rest from :root.
const themes = { light, dark: { ...light, ...parse(darkCss) } } as const;

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratioIn = (theme: Record<string, string>, a: string, b: string) => {
  const [hi, lo] = [luminance(theme[a]), luminance(theme[b])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AA_TEXT = 4.5;
const AA_UI = 3;
const PAGES = ["canvas", "surface", "subtle"];

const textPairs: [string, string][] = [
  ...["ink", "ink-2", "ink-3"].flatMap((fg) => PAGES.map((bg): [string, string] => [fg, bg])),
  ...["link", "red-fg"].flatMap((fg) => ["surface", "canvas"].map((bg): [string, string] => [fg, bg])),
  ["link", "subtle"], ["link", "brand-50"], ["link", "brand-100"],
  ["brand-fg", "brand-100"], ["brand-fg", "brand-50"],
  ["on-brand", "fill"], ["on-brand", "fill-hover"],
  ["accent-800", "surface"], ["accent-800", "accent-50"], ["accent-800", "accent-100"],
  ["success-fg", "success-bg"], ["warning-fg", "warning-bg"], ["error-fg", "error-bg"], ["info-fg", "info-bg"], ["quiet-fg", "quiet-bg"],
  ["code-fg", "code-bg"], ["code-muted", "code-bg"],
  ["chart-label", "surface"], ["chart-label", "canvas"],
  // Labels printed on chart fills
  ["on-series-1", "series-1"], ["on-series-1-light", "series-1-light"], ["on-series-other", "series-other"],
  ["on-good", "status-good"], ["on-warning", "status-warning"], ["on-critical", "status-critical"], ["on-info", "status-info"], ["on-unknown", "status-unknown"],
];

const uiPairs: [string, string][] = [
  ["brand-500", "canvas"], ["brand-500", "surface"], ["control-border", "surface"], ["control-border", "canvas"],
  ["success-dot", "surface"], ["warning-dot", "surface"], ["error-dot", "surface"], ["info-dot", "surface"],
  ["series-1", "surface"], ["series-2", "surface"], ["status-good", "surface"], ["status-critical", "surface"], ["status-info", "surface"],
];
// Decorative hairlines are exempt, but a mark that carries data is not. The one allowed shortfall is the third
// series in the light theme (2.8:1): its relief is that every chart prints its figures in a legend and a table view.
const THIRD_SERIES_FLOOR = { light: 2.5, dark: AA_UI } as const;

describe.each(Object.entries(themes))("design tokens meet WCAG AA in the %s theme", (name, theme) => {
  it.each(textPairs)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratioIn(theme, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(uiPairs)("UI colour %s on %s is at least 3:1", (fg, bg) => {
    expect(ratioIn(theme, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA_UI);
  });

  it("keeps the third chart series visible", () => {
    expect(ratioIn(theme, "series-3", "surface")).toBeGreaterThanOrEqual(THIRD_SERIES_FLOOR[name as keyof typeof THIRD_SERIES_FLOOR]);
  });
});

describe("theme token coverage", () => {
  it("defines every token the dark theme overrides in the light theme too", () => {
    const missing = Object.keys(parse(darkCss)).filter((name) => !(name in light));
    expect(missing).toEqual([]);
  });
});
