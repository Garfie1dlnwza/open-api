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
  /** Full date of the last maintainer review, e.g. "22 Nov 2026". */
  verifiedLabel: string;
  /** Short date for dense rows, e.g. "22 Nov". */
  verifiedShort: string;
  /** When the health probe last ran, relative to the build ("5 minutes ago"); undefined if never. */
  checkedLabel?: string;
  /** Names in the other language(s) so a search in one language finds the other. */
  aliases: string[];
  trustScore: number;
  trustLevel: TrustLevel;
  endpoints: { title: string; path: string }[];
}
