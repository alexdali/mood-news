import { describe, expect, it } from "vitest";
import { deduplicateItems } from "@/modules/ingestion/deduplicate";
import type { NormalizedNewsItem } from "@/modules/ingestion/types";

function item(overrides: Partial<NormalizedNewsItem>): NormalizedNewsItem {
  return {
    sourceId: "source", sourceItemId: "1", sourceName: "Source", canonicalUrl: "https://example.com/1",
    title: "Title", summary: "Summary", section: null, language: "en", imageUrl: null, byline: null,
    publishedAt: "2026-08-14T10:00:00.000Z", fetchedAt: "2026-08-14T10:01:00.000Z", contentHash: "hash", rawPayload: {},
    ...overrides,
  };
}

describe("source-batch deduplication", () => {
  it("keeps one record per source identity and canonical URL", () => {
    const result = deduplicateItems([
      item({ sourceItemId: "1", publishedAt: "2026-08-14T09:00:00.000Z" }),
      item({ sourceItemId: "1", title: "New title", publishedAt: "2026-08-14T10:00:00.000Z" }),
      item({ sourceItemId: "2", canonicalUrl: "https://example.com/1" }),
      item({ sourceItemId: "3", canonicalUrl: "https://example.com/3" }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((entry) => entry.sourceItemId === "1")?.title).toBe("New title");
  });
});
