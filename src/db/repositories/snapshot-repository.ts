import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import { parseJson } from "@/core/json";
import type { ArticleSnapshot } from "@/domain/news/snapshot";

export type SnapshotInsertInput = {
  articleId: string;
  version: number;
  contentHash: string;
  normalizedPayload: Record<string, unknown>;
  rawPayload: unknown;
  fetchedAt: string;
};

type ArticleSnapshotRow = {
  id: string;
  article_id: string;
  version: number;
  content_hash: string;
  normalized_payload_json: string;
  raw_payload_json: string;
  fetched_at: string;
  created_at: string;
};

export class SnapshotRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  insert(input: SnapshotInsertInput): string {
    const id = createId("snapshot");
    this.db.prepare(`
      INSERT INTO article_snapshots(
        id, article_id, version, content_hash, normalized_payload_json,
        raw_payload_json, fetched_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.articleId,
      input.version,
      input.contentHash,
      JSON.stringify(input.normalizedPayload),
      JSON.stringify(input.rawPayload),
      input.fetchedAt,
      nowIso(),
    );
    return id;
  }

  listForArticle(articleId: string): ArticleSnapshot[] {
    const rows = this.db.prepare(`
      SELECT * FROM article_snapshots
      WHERE article_id = ?
      ORDER BY version DESC
    `).all(articleId) as ArticleSnapshotRow[];

    return rows.map((row) => ({
      id: row.id,
      articleId: row.article_id,
      version: row.version,
      contentHash: row.content_hash,
      normalizedPayload: parseJson<Record<string, unknown>>(row.normalized_payload_json, {}),
      rawPayload: parseJson<unknown>(row.raw_payload_json, null),
      fetchedAt: row.fetched_at,
      createdAt: row.created_at,
    }));
  }

  countForArticle(articleId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS count FROM article_snapshots WHERE article_id = ?
    `).get(articleId) as { count: number };
    return row.count;
  }
}
