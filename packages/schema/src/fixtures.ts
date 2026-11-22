import { ApiEntrySchema, type ApiEntry } from "./entry.ts";

/** Minimal valid entry for tests; override pieces per test. */
export function makeEntry(overrides: Record<string, unknown> = {}): ApiEntry {
  return ApiEntrySchema.parse({
    id: "demo",
    name: { th: "ตัวอย่าง", en: "Demo" },
    provider: { name: { th: "หน่วยงาน", en: "Agency" } },
    description: { th: "คำอธิบาย", en: "Description" },
    category: "government",
    source: "official",
    baseUrl: "https://api.example.go.th/v1",
    docsUrl: "https://docs.example.go.th",
    license: { type: "open", verified: true },
    reviewedAt: "2026-11-01",
    endpoints: [
      {
        id: "rates",
        path: "/rates/{currency}",
        title: { th: "อัตรา", en: "Rates" },
        description: { th: "อัตรา", en: "Rates" },
        params: [
          { name: "currency", in: "path", required: true, description: { th: "สกุลเงิน", en: "Currency" } },
          { name: "limit", in: "query", type: "integer", min: 1, max: 50, description: { th: "จำนวน", en: "Limit" } },
        ],
        example: { currency: "USD", limit: "5" },
        health: { checks: [{ kind: "json", path: "data", type: "array", minItems: 1 }] },
      },
    ],
    ...overrides,
  });
}
