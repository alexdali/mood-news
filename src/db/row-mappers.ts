import type { NewsArticle } from "@/domain/news/article";
import type { NewsRewrite } from "@/domain/news/rewrite";
import type { ProtectedFact } from "@/domain/fact-lock/fact";
import type { NewsArticleRow, ProtectedFactRow, RewriteRow } from "@/db/schema";
import { isMood } from "@/domain/news/mood";

export function mapArticleRow(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source_name ?? row.source_id,
    sourceItemId: row.source_item_id,
    canonicalUrl: row.canonical_url,
    title: row.title,
    summary: row.summary,
    section: row.section,
    language: row.language,
    imageUrl: row.image_url,
    byline: row.byline,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    contentHash: row.content_hash,
    version: row.version,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRewriteRow(row: RewriteRow): NewsRewrite {
  if (!isMood(row.mood)) throw new Error(`Invalid mood in database: ${row.mood}`);
  return {
    id: row.id,
    articleId: row.article_id,
    mood: row.mood,
    locale: row.locale,
    title: row.title,
    summary: row.summary,
    model: row.model,
    promptVersion: row.prompt_version,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFactRow(row: ProtectedFactRow): ProtectedFact {
  return {
    id: row.id,
    articleId: row.article_id,
    factType: row.fact_type as ProtectedFact["factType"],
    value: row.value,
    normalizedValue: row.normalized_value,
    placeholder: row.placeholder,
    sourceField: row.source_field,
    startIndex: row.start_index,
    endIndex: row.end_index,
    extractor: row.extractor,
    createdAt: row.created_at,
  };
}
