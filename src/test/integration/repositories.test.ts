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
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { NewsQueryService } from "@/modules/news/news-query-service";

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

  it("stores request-level AI billing, cache, prompts and Fact Lock rejection details", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const inserted = new NewsRepository(db).upsert({
      sourceId: "source", sourceItemId: "audit-1", canonicalUrl: "https://example.com/audit",
      title: "Audit headline", summary: "Audit summary", section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z", contentHash: "audit-hash", rawPayload: {},
    });
    const runs = new AiRunRepository(db);
    runs.record({
      articleId: inserted.articleId,
      model: "provider/model",
      modelRole: "primary",
      status: "validation_error",
      locale: "ru",
      promptVersion: "v-audit",
      latencyMs: 321,
      usage: { inputTokens: 100, outputTokens: 40, reasoningTokens: 3, cachedInputTokens: 75, cacheWriteTokens: 10, costUsd: 0.0025 },
      cacheStatus: "HIT",
      providerRequestId: "request-1",
      systemPrompt: "Preserve facts.",
      userPrompt: "Rewrite this article.",
      responseText: "{\"variants\":[]}",
      errorCode: "FACT_LOCK_REJECTED",
      errorMessage: "A protected value is missing.",
      validationDetails: {
        stage: "fact_lock",
        variants: [{
          mood: "neutral", score: 50, expectedCount: 2, preservedCount: 1,
          missing: ["[[F_TITLE_1]]"], duplicates: [], unknown: [], addedFacts: [],
          issues: [{ code: "missing_placeholder", message: "Placeholder is missing", field: "title", values: ["[[F_TITLE_1]]"] }],
        }],
      },
    });

    expect(runs.countAll()).toBe(1);
    expect(runs.countValidationFailures()).toBe(1);
    expect(runs.costAllTime()).toBeCloseTo(0.0025);
    expect(runs.costByDay()[0]).toMatchObject({ requests: 1, inputTokens: 100, outputTokens: 40, cachedInputTokens: 75, costUsd: 0.0025 });
    expect(runs.listRecent(10)[0]).toMatchObject({
      articleTitle: "Audit headline", cacheStatus: "HIT", systemPrompt: "Preserve facts.", responseText: "{\"variants\":[]}",
      usage: { inputTokens: 100, outputTokens: 40, reasoningTokens: 3, cachedInputTokens: 75, cacheWriteTokens: 10, costUsd: 0.0025 },
    });
    expect(runs.listValidationFailures(10)[0]?.validationDetails).toMatchObject({
      stage: "fact_lock", variants: [{ mood: "neutral", missing: ["[[F_TITLE_1]]"] }],
    });
  });

  it("prioritizes unattempted rewrites over repeated failures for the current prompt", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const failed = news.upsert({
      sourceId: "source", sourceItemId: "retry-1", canonicalUrl: "https://example.com/retry-1",
      title: "Newest article", summary: "Newest summary", section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T11:00:00Z", fetchedAt: "2026-08-14T11:01:00Z", contentHash: "retry-1", rawPayload: {},
    });
    const unattempted = news.upsert({
      sourceId: "source", sourceItemId: "retry-2", canonicalUrl: "https://example.com/retry-2",
      title: "Older article", summary: "Older summary", section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z", contentHash: "retry-2", rawPayload: {},
    });
    new AiRunRepository(db).record({
      articleId: failed.articleId,
      model: "model",
      modelRole: "primary",
      status: "validation_error",
      locale: "ru",
      promptVersion: "v-current",
      latencyMs: 10,
      errorCode: "FACT_LOCK_REJECTED",
    });

    expect(news.listPendingForPrompt("v-current", "ru", 4, 1)[0]?.id).toBe(unattempted.articleId);
    expect(news.listPendingForPrompt("another-prompt", "ru", 4, 1)[0]?.id).toBe(failed.articleId);
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

  it("never exposes an English source item as Russian grid content", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const inserted = news.upsert({
      sourceId: "source", sourceItemId: "ru-grid-1", canonicalUrl: "https://example.com/ru-grid",
      title: "English source title", summary: "English source summary.",
      section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "ru-grid-hash", rawPayload: {},
    });
    const rewrites = new RewriteRepository(db);
    const service = new NewsQueryService(news, rewrites);

    expect(service.list({ mood: "neutral", locale: "ru" })).toEqual([]);

    const validation: FactValidationResult = {
      passed: true, score: 100, expectedCount: 0, preservedCount: 0,
      missing: [], duplicates: [], unknown: [], addedFacts: [], issues: [],
    };
    rewrites.saveValidatedBatch({
      articleId: inserted.articleId,
      locale: "ru",
      model: "model",
      promptVersion: "mood-v2-localized-facts",
      validations: new Map(moods.map((mood) => [mood, validation])),
      variants: moods.map((mood) => ({ mood, title: `Русский ${mood}`, summary: "Русское описание" })),
    });

    const russian = service.list({ mood: "neutral", locale: "ru" });
    expect(russian).toHaveLength(1);
    expect(russian[0]?.displayTitle).toBe("Русский neutral");
    expect(service.list({ mood: "neutral", locale: "en" })[0]?.displayTitle).toBe("English source title");
  });

  it("stores separate localized values for each canonical fact", () => {
    db = createDatabase(":memory:");
    new SourceRepository(db).upsert({ id: "source", kind: "rss", name: "Source", baseUrl: "https://example.com/rss", enabled: true });
    const news = new NewsRepository(db);
    const inserted = news.upsert({
      sourceId: "source", sourceItemId: "facts-1", canonicalUrl: "https://example.com/facts",
      title: "Russia reports 24 flights", summary: "Moscow published the result.",
      section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", fetchedAt: "2026-08-14T10:01:00Z",
      contentHash: "facts-hash", rawPayload: {},
    });
    const repository = new FactRepository(db);
    const extracted = protectArticleText(inserted.articleId, "Russia reports 24 flights", "Moscow published the result.");
    const canonical = repository.replaceForArticle(inserted.articleId, extracted.facts);
    repository.saveLocalizations(inserted.articleId, "en", canonical, "source");
    repository.saveLocalizations(inserted.articleId, "ru", canonical.map((fact) => ({
      ...fact,
      value: fact.value === "Russia" ? "Россия" : fact.value === "Moscow" ? "Москва" : fact.value,
      normalizedValue: fact.value === "Russia" ? "россия" : fact.value === "Moscow" ? "москва" : fact.normalizedValue,
    })), "translator");

    expect(repository.listLocalizedForArticle(inserted.articleId, "en").map((fact) => fact.value))
      .toEqual(expect.arrayContaining(["Russia", "Moscow", "24"]));
    const russian = repository.listLocalizedForArticle(inserted.articleId, "ru");
    expect(russian.map((fact) => fact.value)).toEqual(expect.arrayContaining(["Россия", "Москва", "24"]));
    expect(russian.find((fact) => fact.value === "Россия")?.sourceValue).toBe("Russia");
    expect(russian.find((fact) => fact.value === "Россия")?.localizationModel).toBe("translator");

    const idsBeforeSync = new Map(canonical.map((fact) => [fact.placeholder, fact.id]));
    const resynced = repository.replaceForArticle(inserted.articleId, extracted.facts);
    expect(resynced.map((fact) => fact.sourceField)).toEqual([
      ...resynced.filter((fact) => fact.sourceField === "title").map(() => "title" as const),
      ...resynced.filter((fact) => fact.sourceField === "summary").map(() => "summary" as const),
    ]);
    expect(resynced.every((fact) => idsBeforeSync.get(fact.placeholder) === fact.id)).toBe(true);
    expect(repository.listLocalizedForArticle(inserted.articleId, "en").map((fact) => fact.value))
      .toEqual(expect.arrayContaining(["Russia", "Moscow", "24"]));
    expect(repository.listLocalizedForArticle(inserted.articleId, "ru").map((fact) => fact.value))
      .toEqual(expect.arrayContaining(["Россия", "Москва", "24"]));
  });
});
