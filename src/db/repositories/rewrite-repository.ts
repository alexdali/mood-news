import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import type { Mood } from "@/domain/news/mood";
import type { NewsRewrite, RewriteVariantInput } from "@/domain/news/rewrite";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import type { RewriteRow, ValidationRunRow } from "@/db/schema";
import { mapRewriteRow } from "@/db/row-mappers";
import { parseJson } from "@/core/json";

export type RewriteWithValidation = {
  rewrite: NewsRewrite;
  validation: FactValidationResult | null;
};

export class RewriteRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  saveValidatedBatch(input: {
    articleId: string;
    model: string;
    promptVersion: string;
    variants: RewriteVariantInput[];
    validations: Map<Mood, FactValidationResult>;
  }): void {
    const save = this.db.transaction(() => {
      for (const variant of input.variants) {
        const existing = this.db.prepare(`
          SELECT id FROM rewrites
          WHERE article_id = ? AND mood = ? AND prompt_version = ?
        `).get(input.articleId, variant.mood, input.promptVersion) as { id: string } | undefined;

        const rewriteId = existing?.id ?? createId("rewrite");
        const now = nowIso();
        this.db.prepare(`
          INSERT INTO rewrites(
            id, article_id, mood, title, summary, model, prompt_version,
            status, created_at, updated_at
          ) VALUES (
            @id, @articleId, @mood, @title, @summary, @model, @promptVersion,
            'validated', @now, @now
          )
          ON CONFLICT(article_id, mood, prompt_version) DO UPDATE SET
            title = excluded.title,
            summary = excluded.summary,
            model = excluded.model,
            status = 'validated',
            updated_at = excluded.updated_at
        `).run({
          id: rewriteId,
          articleId: input.articleId,
          mood: variant.mood,
          title: variant.title,
          summary: variant.summary,
          model: input.model,
          promptVersion: input.promptVersion,
          now,
        });

        const validation = input.validations.get(variant.mood);
        if (!validation) throw new Error(`Missing validation for mood ${variant.mood}`);
        this.db.prepare(`
          INSERT INTO validation_runs(
            id, rewrite_id, passed, score, expected_count, preserved_count,
            missing_json, duplicate_json, unknown_json, added_facts_json,
            details_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          createId("validation"),
          rewriteId,
          validation.passed ? 1 : 0,
          validation.score,
          validation.expectedCount,
          validation.preservedCount,
          JSON.stringify(validation.missing),
          JSON.stringify(validation.duplicates),
          JSON.stringify(validation.unknown),
          JSON.stringify(validation.addedFacts),
          JSON.stringify({ issues: validation.issues }),
          now,
        );
      }
    });
    save();
  }

  find(articleId: string, mood: Mood, promptVersion: string): RewriteWithValidation | null {
    const rewriteRow = this.db.prepare(`
      SELECT * FROM rewrites
      WHERE article_id = ? AND mood = ? AND prompt_version = ? AND status = 'validated'
    `).get(articleId, mood, promptVersion) as RewriteRow | undefined;
    if (!rewriteRow) return null;

    const validationRow = this.db.prepare(`
      SELECT * FROM validation_runs
      WHERE rewrite_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(rewriteRow.id) as ValidationRunRow | undefined;

    return {
      rewrite: mapRewriteRow(rewriteRow),
      validation: validationRow ? {
        passed: validationRow.passed === 1,
        score: validationRow.score,
        expectedCount: validationRow.expected_count,
        preservedCount: validationRow.preserved_count,
        missing: parseJson<string[]>(validationRow.missing_json, []),
        duplicates: parseJson<string[]>(validationRow.duplicate_json, []),
        unknown: parseJson<string[]>(validationRow.unknown_json, []),
        addedFacts: parseJson<string[]>(validationRow.added_facts_json, []),
        issues: parseJson<{ issues?: FactValidationResult["issues"] }>(validationRow.details_json, {}).issues ?? [],
      } : null,
    };
  }

  listForArticle(articleId: string, promptVersion: string): NewsRewrite[] {
    const rows = this.db.prepare(`
      SELECT * FROM rewrites
      WHERE article_id = ? AND prompt_version = ? AND status = 'validated'
      ORDER BY mood
    `).all(articleId, promptVersion) as RewriteRow[];
    return rows.map(mapRewriteRow);
  }

  countValidated(promptVersion: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS count FROM rewrites
      WHERE prompt_version = ? AND status = 'validated'
    `).get(promptVersion) as { count: number };
    return row.count;
  }
}
