import { afterEach, describe, expect, it } from "vitest";
import type { SqliteDatabase } from "@/db/types";
import { createDatabase } from "@/db/client";
import { SourceRepository } from "@/db/repositories/source-repository";
import { NewsRepository } from "@/db/repositories/news-repository";
import { JobLockRepository } from "@/db/repositories/job-lock-repository";
import { SnapshotRepository } from "@/db/repositories/snapshot-repository";
import { AiRunRepository } from "@/db/repositories/ai-run-repository";

let db: SqliteDatabase | undefined;
afterEach(() => db?.close());

describe("SQLite repositories", () => {
  it("persists source records and idempotently upserts news", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const input = {
      sourceId: "source", sourceItemId: "item-1", canonicalUrl: "https://example.com/story",
      title: "Headline", summary: "Summary", section: null, language: "en", imageUrl: null,
      byline: null, publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "hash-1", rawPayload: { guid: "item-1" },
    };
    const first = news.upsert(input);
    const second = news.upsert({ ...input, fetchedAt: "2026-08-14T10:02:00Z" });
    expect(first.outcome).toBe("inserted");
    expect(second).toEqual({ articleId: first.articleId, outcome: "skipped" });
    expect(news.countActive()).toBe(1);
    expect(new SnapshotRepository(db).countForArticle(first.articleId)).toBe(1);
  });

  it("does not corrupt source identity when the same canonical URL appears in another feed", () => {
    db = createDatabase(":memory:");
    const sources = new SourceRepository(db);
    sources.upsert({ id: "feed-a", kind: "rss", name: "Feed A", baseUrl: "https://example.com/a", enabled: true });
    sources.upsert({ id: "feed-b", kind: "rss", name: "Feed B", baseUrl: "https://example.com/b", enabled: true });
    const news = new NewsRepository(db);
    const first = news.upsert({
      sourceId: "feed-a", sourceItemId: "a-1", canonicalUrl: "https://example.com/shared",
      title: "Headline", summary: "First summary", section: null, language: "en", imageUrl: null,
      byline: null, publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "hash-a", rawPayload: { feed: "a" },
    });
    const duplicate = news.upsert({
      sourceId: "feed-b", sourceItemId: "b-9", canonicalUrl: "https://example.com/shared",
      title: "Headline", summary: "Different feed fragment", section: null, language: "en", imageUrl: null,
      byline: null, publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:05:00Z",
      contentHash: "hash-b", rawPayload: { feed: "b" },
    });

    const article = news.findById(first.articleId);
    expect(duplicate).toEqual({ articleId: first.articleId, outcome: "skipped" });
    expect(article?.sourceId).toBe("feed-a");
    expect(article?.sourceItemId).toBe("a-1");
    expect(article?.summary).toBe("First summary");
    expect(new SnapshotRepository(db).countForArticle(first.articleId)).toBe(1);
  });

  it("versions changed source content and retains immutable snapshots", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const base = {
      sourceId: "source", sourceItemId: "item-2", canonicalUrl: "https://example.com/story-2",
      title: "Headline", summary: "First summary", section: null, language: "en", imageUrl: null,
      byline: null, publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "hash-v1", rawPayload: { version: 1 },
    };
    const first = news.upsert(base);
    const changed = news.upsert({
      ...base,
      summary: "Corrected summary",
      fetchedAt: "2026-08-14T10:05:00Z",
      contentHash: "hash-v2",
      rawPayload: { version: 2 },
    });

    expect(changed).toEqual({ articleId: first.articleId, outcome: "updated" });
    expect(news.findById(first.articleId)?.version).toBe(2);
    const snapshots = new SnapshotRepository(db).listForArticle(first.articleId);
    expect(snapshots.map((snapshot) => snapshot.version)).toEqual([2, 1]);
    expect(snapshots[0]?.normalizedPayload.summary).toBe("Corrected summary");
  });

  it("provides expiring cross-process job locks", () => {
    db = createDatabase(":memory:");
    const locks = new JobLockRepository(db);
    expect(locks.acquire("ingest", "worker-a", 60_000)).toBe(true);
    expect(locks.acquire("ingest", "worker-b", 60_000)).toBe(false);
    locks.release("ingest", "worker-a");
    expect(locks.acquire("ingest", "worker-b", 60_000)).toBe(true);
  });

  it("returns numeric zeroes for empty AI metrics", () => {
    db = createDatabase(":memory:");
    expect(new AiRunRepository(db).summaryLast24Hours()).toEqual({
      requests: 0,
      failures: 0,
      costUsd: 0,
      averageLatencyMs: 0,
    });
  });
});
