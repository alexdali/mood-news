import type { NewsArticle } from "@/domain/news/article";

export const sourceTitle = "NASA and ESA announce $12.5 million Moon study on August 14, 2026";
export const sourceSummary = 'The agencies said the project involves 24 researchers in Paris and quoted Dr Jane Smith: “We will publish the results in 2027.”';

export function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: "article_test",
    sourceId: "source_test",
    sourceName: "Test Source",
    sourceItemId: "source-item-1",
    canonicalUrl: "https://example.com/news/moon-study",
    title: sourceTitle,
    summary: sourceSummary,
    section: "science",
    language: "en",
    imageUrl: null,
    byline: "Test Reporter",
    publishedAt: "2026-08-14T12:00:00.000Z",
    fetchedAt: "2026-08-14T12:03:00.000Z",
    contentHash: "hash",
    version: 1,
    status: "active",
    createdAt: "2026-08-14T12:03:00.000Z",
    updatedAt: "2026-08-14T12:03:00.000Z",
    ...overrides,
  };
}
