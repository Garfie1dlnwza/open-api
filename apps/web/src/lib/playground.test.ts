import { describe, expect, it } from "vitest";
import { UI } from "../config/site.ts";
import { isPreviewClipped, prettyBody, prettyXml } from "./playground.ts";

describe("prettyXml", () => {
  it("indents nested elements and keeps short text elements on one line", () => {
    const xml = '<?xml version="1.0"?><root><item id="1"><title>Hello</title><empty/></item></root>';
    expect(prettyXml(xml)).toBe(['<?xml version="1.0"?>', "<root>", '  <item id="1">', "    <title>Hello</title>", "    <empty/>", "  </item>", "</root>"].join("\n"));
  });

  it("leaves documents with CDATA alone and never throws on odd input", () => {
    const cdata = "<a><![CDATA[1 > 0 <b>]]></a>";
    expect(prettyXml(cdata)).toBe(cdata);
    expect(prettyXml("not xml at all")).toBe("not xml at all");
    expect(prettyXml("</a></a>")).toBe("</a>\n</a>");
  });
});

describe("prettyXml limits", () => {
  it("stays fast and bounded on hostile, deeply nested input", () => {
    const deep = "<a>".repeat(400_000);
    const started = performance.now();
    const out = prettyXml(deep);
    expect(performance.now() - started).toBeLessThan(1_000);
    // Preview cap, plus at most one more line, and indentation never exceeds the clamp.
    expect(out.length).toBeLessThan(UI.responsePreviewChars + 100);
    expect(Math.max(...out.split("\n").map((l) => l.length - l.trimStart().length))).toBeLessThanOrEqual(48);
  });

  it("marks an oversized document as longer than the preview so the viewer shows its truncation note", () => {
    const wide = `<r>${"<i>x</i>".repeat(100_000)}</r>`;
    expect(prettyXml(wide).length).toBeGreaterThan(UI.responsePreviewChars);
  });
});

describe("prettyBody", () => {
  it("formats by content type and falls back to the raw text", () => {
    expect(prettyBody('{"a":1}', "application/json")).toBe('{\n  "a": 1\n}');
    expect(prettyBody("{broken", "application/json")).toBe("{broken");
    expect(prettyBody("<a><b>x</b></a>", "text/xml; charset=utf-8")).toBe("<a>\n  <b>x</b>\n</a>");
    expect(prettyBody("plain", "text/plain")).toBe("plain");
  });
});

describe("isPreviewClipped", () => {
  const cap = UI.responsePreviewChars;
  it("reports a cut XML body even when the formatted text came out shorter than the cap", () => {
    // Whitespace-heavy XML collapses when formatted, so "shown" can be well under the cap.
    const body = `<r>${"<i>x</i>\n        ".repeat(40_000)}</r>`;
    const shown = prettyXml(body);
    expect(body.length).toBeGreaterThan(cap);
    expect(isPreviewClipped(body, shown, "application/xml", "pretty")).toBe(true);
  });
  it("is false for small bodies and judges raw mode by what is shown", () => {
    expect(isPreviewClipped("<a/>", "<a/>", "application/xml", "pretty")).toBe(false);
    expect(isPreviewClipped("x".repeat(cap + 1), "x".repeat(cap + 1), "text/plain", "raw")).toBe(true);
    expect(isPreviewClipped("x".repeat(cap + 1), "short", "application/xml", "raw")).toBe(false);
  });
});
