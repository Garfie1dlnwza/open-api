import { describe, expect, it } from "vitest";
import { prettyBody, prettyXml } from "./playground.ts";

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

describe("prettyBody", () => {
  it("formats by content type and falls back to the raw text", () => {
    expect(prettyBody('{"a":1}', "application/json")).toBe('{\n  "a": 1\n}');
    expect(prettyBody("{broken", "application/json")).toBe("{broken");
    expect(prettyBody("<a><b>x</b></a>", "text/xml; charset=utf-8")).toBe("<a>\n  <b>x</b>\n</a>");
    expect(prettyBody("plain", "text/plain")).toBe("plain");
  });
});
