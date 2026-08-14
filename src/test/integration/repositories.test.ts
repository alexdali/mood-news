import { afterEach, describe, expect, it } from "vitest";
import type { SqliteDatabase } from "@/db/types";
import { createDatabase } from "@/db/client";
import { SourceRepository } from "@/db/repositories/source-repository";
import { NewsRepository } from "@/db/repositories/news-repository";
import { JobLockRepository } from "@/db/repositories/job-lock-repository";
import { SnapshotRepository } from "@/db/repositories/snapshot-repository";
import { AiRunRepository } from "@/db/repositories/ai-run-repository";
import { RewriteRepository } from "@/db/repositories/rewrite-repository";
import { FactRepository } from "@/db/repositories/fact-repository";
import { NewsDetailService } from "@/modules/news/news-detail-service";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import { moods } from "@/domain/news/mood";

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

  it("previews the Fact Lock ledger before an AI rewrite exists", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const inserted = news.upsert({
      sourceId: "source", sourceItemId: "pending-1", canonicalUrl: "https://example.com/pending",
      title: "Paris hosts 24 researchers", summary: "Dr Jane Smith announced the study.",
      section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "pending-hash", rawPayload: {},
    });
    const detail = new NewsDetailService(
      news,
      new RewriteRepository(db),
      new FactRepository(db),
    ).get(inserted.articleId, "neutral", "en");

    expect(detail.rewrite).toBeNull();
    expect(detail.facts.map((fact) => fact.value)).toEqual(expect.arrayContaining(["Paris", "24", "Dr Jane Smith"]));
  });

  it("stores English and Russian rewrites independently", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const inserted = news.upsert({
      sourceId: "source", sourceItemId: "localized-1", canonicalUrl: "https://example.com/localized",
      title: "City opens a library", summary: "The library opened on Monday.",
      section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "localized-hash", rawPayload: {},
    });
    const rewrites = new RewriteRepository(db);
    const validation: FactValidationResult = {
      passed: true, score: 1, expectedCount: 0, preservedCount: 0,
      missing: [], duplicates: [], unknown: [], addedFacts: [], issues: [],
    };
    const validations = new Map(moods.map((mood) => [mood, validation]));
    rewrites.saveValidatedBatch({
      articleId: inserted.articleId, locale: "en", model: "model", promptVersion: "v1", validations,
      variants: moods.map((mood) => ({ mood, title: `English ${mood}`, summary: "English summary" })),
    });
    rewrites.saveValidatedBatch({
      articleId: inserted.articleId, locale: "ru", model: "model", promptVersion: "v1", validations,
      variants: moods.map((mood) => ({ mood, title: `Русский ${mood}`, summary: "Русское описание" })),
    });

    expect(rewrites.find(inserted.articleId, "neutral", "en", "v1")?.rewrite.title).toBe("English neutral");
    expect(rewrites.find(inserted.articleId, "neutral", "ru", "v1")?.rewrite.title).toBe("Русский neutral");
    expect(rewrites.countValidated("v1")).toBe(8);
  });
});
