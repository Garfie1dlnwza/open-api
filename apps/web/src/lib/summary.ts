import type { AuthType, Category, LicenseType, Source, Status, TrustLevel } from "@thai-open-api/schema";

/** Serializable, already-localised view of an API. Safe to ship to islands and the search index. */
export interface ApiSummary {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: Category;
  categoryLabel: string;
  source: Source;
  auth: AuthType;
  license: { type: LicenseType; verified: boolean };
  tags: string[];
  status: Status;
  reviewedAt: string;
  verifiedLabel: string;
  /** Compact relative time for dense rows ("12h ago"). */
  verifiedShort: string;
  trustScore: number;
  trustLevel: TrustLevel;
  endpoints: { title: string; path: string }[];
}
