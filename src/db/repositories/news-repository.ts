import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import type { NewsArticle } from "@/domain/news/article";
import type { NewsArticleRow } from "@/db/schema";
import { mapArticleRow } from "@/db/row-mappers";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import { SnapshotRepository } from "@/db/repositories/snapshot-repository";
import type { Locale } from "@/i18n/ui";
import type { Mood } from "@/domain/news/mood";

export type ArticleUpsertInput = {
  sourceId: string;
  sourceItemId: string;
  canonicalUrl: string;
  title: string;
  summary: string;
  section: string | null;
  language: string;
  imageUrl: string | null;
  byline: string | null;
  publishedAt: string;
  fetchedAt: string;
  contentHash: string;
  rawPayload: unknown;
};

export type ArticleUpsertResult = {
  articleId: string;
  outcome: "inserted" | "updated" | "skipped";
};

export class NewsRepository {
  private readonly snapshots: SnapshotRepository;

  constructor(private readonly db: SqliteDatabase = getDatabase()) {
    this.snapshots = new SnapshotRepository(db);
  }

  upsert(input: ArticleUpsertInput): ArticleUpsertResult {
    const identityMatch = this.db.prepare(`
      SELECT * FROM news_articles
      WHERE source_id = ? AND source_item_id = ?
      LIMIT 1
    `).get(input.sourceId, input.sourceItemId) as NewsArticleRow | undefined;
    const canonicalMatch = identityMatch ?? this.db.prepare(`
      SELECT * FROM news_articles
      WHERE canonical_url = ?
      LIMIT 1
    `).get(input.canonicalUrl) as NewsArticleRow | undefined;
    const existing = identityMatch ?? canonicalMatch;

    // The same story can appear in several BBC category feeds. Never overwrite
    // the provenance/content of the first stored record with a different source.
    // A production system can model many-to-many source sightings separately.
    if (!identityMatch && canonicalMatch && canonicalMatch.source_id !== input.sourceId) {
      return { articleId: canonicalMatch.id, outcome: "skipped" };
    }

    const rawPayloadJson = JSON.stringify(input.rawPayload);
    if (!existing) {
      const articleId = createId("article");
      const now = nowIso();
      const version = 1;
      const insert = this.db.transaction(() => {
        this.db.prepare(`
          INSERT INTO news_articles(
            id, source_id, source_item_id, canonical_url, title, summary, section,
            language, image_url, byline, published_at, fetched_at, content_hash,
            raw_payload_json, version, status, created_at, updated_at
          ) VALUES (
            @id, @sourceId, @sourceItemId, @canonicalUrl, @title, @summary, @section,
            @language, @imageUrl, @byline, @publishedAt, @fetchedAt, @contentHash,
            @rawPayloadJson, @version, 'active', @now, @now
          )
        `).run({ id: articleId, ...input, rawPayloadJson, version, now });
        this.snapshots.insert({
          articleId,
          version,
          contentHash: input.contentHash,
          normalizedPayload: normalizedPayload(input),
          rawPayload: input.rawPayload,
          fetchedAt: input.fetchedAt,
        });
      });
      insert();
      return { articleId, outcome: "inserted" };
    }

    if (existing.content_hash === input.contentHash) {
      this.db.prepare(`
        UPDATE news_articles
        SET fetched_at = ?, raw_payload_json = ?, updated_at = ?
        WHERE id = ?
      `).run(input.fetchedAt, rawPayloadJson, nowIso(), existing.id);
      return { articleId: existing.id, outcome: "skipped" };
    }

    const nextVersion = existing.version + 1;
    const update = this.db.transaction(() => {
      const updatedAt = nowIso();
      this.db.prepare(`
        UPDATE news_articles SET
          source_item_id = @sourceItemId,
          canonical_url = @canonicalUrl,
          title = @title,
          summary = @summary,
          section = @section,
          language = @language,
          image_url = @imageUrl,
          byline = @byline,
          published_at = @publishedAt,
          fetched_at = @fetchedAt,
          content_hash = @contentHash,
          raw_payload_json = @rawPayloadJson,
          version = @version,
          status = 'active',
          updated_at = @updatedAt
        WHERE id = @id
      `).run({
        id: existing.id,
        ...input,
        rawPayloadJson,
        version: nextVersion,
        updatedAt,
      });
      this.snapshots.insert({
        articleId: existing.id,
        version: nextVersion,
        contentHash: input.contentHash,
        normalizedPayload: normalizedPayload(input),
        rawPayload: input.rawPayload,
        fetchedAt: input.fetchedAt,
      });
      this.db.prepare("DELETE FROM protected_facts WHERE article_id = ?").run(existing.id);
      this.db.prepare("UPDATE rewrites SET status = 'stale', updated_at = ? WHERE article_id = ?")
        .run(updatedAt, existing.id);
    });
    update();
    return { articleId: existing.id, outcome: "updated" };
  }

  findById(id: string): NewsArticle | null {
    const row = this.db.prepare(`
      SELECT a.*, s.name AS source_name
      FROM news_articles a
      JOIN sources s ON s.id = a.source_id
      WHERE a.id = ?
    `).get(id) as NewsArticleRow | undefined;
    return row ? mapArticleRow(row) : null;
  }

  list(input: { limit: number; offset?: number; status?: NewsArticle["status"] } = { limit: 24 }): NewsArticle[] {
    const rows = this.db.prepare(`
      SELECT a.*, s.name AS source_name
      FROM news_articles a
      JOIN sources s ON s.id = a.source_id
      WHERE a.status = @status
      ORDER BY a.published_at DESC
      LIMIT @limit OFFSET @offset
    `).all({
      status: input.status ?? "active",
      limit: input.limit,
      offset: input.offset ?? 0,
    }) as NewsArticleRow[];
    return rows.map(mapArticleRow);
  }

  listWithValidatedRewrite(input: {
    promptVersion: string;
    locale: Locale;
    mood: Mood;
    limit: number;
    offset?: number;
  }): NewsArticle[] {
    const rows = this.db.prepare(`
      SELECT a.*, s.name AS source_name
      FROM news_articles a
      JOIN sources s ON s.id = a.source_id
      JOIN rewrites r
        ON r.article_id = a.id
       AND r.prompt_version = @promptVersion
       AND r.locale = @locale
       AND r.mood = @mood
       AND r.status = 'validated'
      WHERE a.status = 'active'
      ORDER BY a.published_at DESC
      LIMIT @limit OFFSET @offset
    `).all({ ...input, offset: input.offset ?? 0 }) as NewsArticleRow[];
    return rows.map(mapArticleRow);
  }

  listPendingForPrompt(promptVersion: string, locale: Locale, expectedMoodCount: number, limit: number): NewsArticle[] {
    const rows = this.db.prepare(`
      SELECT a.*, s.name AS source_name
      FROM news_articles a
      JOIN sources s ON s.id = a.source_id
      LEFT JOIN rewrites r
        ON r.article_id = a.id
       AND r.prompt_version = @promptVersion
       AND r.locale = @locale
       AND r.status = 'validated'
      LEFT JOIN (
        SELECT article_id, locale, prompt_version, COUNT(*) AS attempt_count
        FROM ai_runs
        GROUP BY article_id, locale, prompt_version
      ) attempts
        ON attempts.article_id = a.id
       AND attempts.locale = @locale
       AND attempts.prompt_version = @promptVersion
      WHERE a.status = 'active'
      GROUP BY a.id
      HAVING COUNT(r.id) < @expectedMoodCount
      ORDER BY COALESCE(attempts.attempt_count, 0), a.published_at DESC
      LIMIT @limit
    `).all({ promptVersion, locale, expectedMoodCount, limit }) as NewsArticleRow[];
    return rows.map(mapArticleRow);
  }

  countActive(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM news_articles WHERE status = 'active'").get() as { count: number };
    return row.count;
  }
}

function normalizedPayload(input: ArticleUpsertInput): Record<string, unknown> {
  return {
    sourceId: input.sourceId,
    sourceItemId: input.sourceItemId,
    canonicalUrl: input.canonicalUrl,
    title: input.title,
    summary: input.summary,
    section: input.section,
    language: input.language,
    imageUrl: input.imageUrl,
    byline: input.byline,
    publishedAt: input.publishedAt,
  };
}
