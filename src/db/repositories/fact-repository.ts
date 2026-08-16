import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import type { LocalizedProtectedFact, ProtectedFact } from "@/domain/fact-lock/fact";
import type { LocalizedProtectedFactRow, ProtectedFactRow } from "@/db/schema";
import { mapFactRow, mapLocalizedFactRow } from "@/db/row-mappers";
import type { Locale } from "@/i18n/ui";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";

export class FactRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  replaceForArticle(articleId: string, facts: ProtectedFact[]): ProtectedFact[] {
    const replace = this.db.transaction(() => {
      const placeholders = facts.map((fact) => fact.placeholder);
      if (placeholders.length === 0) {
        this.db.prepare("DELETE FROM protected_facts WHERE article_id = ?").run(articleId);
      } else {
        const parameters = placeholders.map(() => "?").join(", ");
        this.db.prepare(`
          DELETE FROM protected_facts
          WHERE article_id = ? AND placeholder NOT IN (${parameters})
        `).run(articleId, ...placeholders);
      }

      const existingRows = this.db.prepare(`
        SELECT * FROM protected_facts WHERE article_id = ?
      `).all(articleId) as ProtectedFactRow[];
      const existingByPlaceholder = new Map(existingRows.map((row) => [row.placeholder, row]));
      const insert = this.db.prepare(`
        INSERT INTO protected_facts(
          id, article_id, fact_type, value, normalized_value, placeholder,
          source_field, start_index, end_index, extractor, created_at
        ) VALUES (
          @id, @articleId, @factType, @value, @normalizedValue, @placeholder,
          @sourceField, @startIndex, @endIndex, @extractor, @createdAt
        )
      `);
      const update = this.db.prepare(`
        UPDATE protected_facts SET
          fact_type = @factType,
          value = @value,
          normalized_value = @normalizedValue,
          source_field = @sourceField,
          start_index = @startIndex,
          end_index = @endIndex,
          extractor = @extractor
        WHERE id = @id
      `);
      for (const fact of facts) {
        const existing = existingByPlaceholder.get(fact.placeholder);
        if (existing) update.run({ ...fact, id: existing.id });
        else insert.run(fact);
      }
    });
    replace();
    return this.listForArticle(articleId);
  }

  listForArticle(articleId: string): ProtectedFact[] {
    const rows = this.db.prepare(`
      SELECT * FROM protected_facts
      WHERE article_id = ?
      ORDER BY CASE source_field WHEN 'title' THEN 0 ELSE 1 END, start_index
    `).all(articleId) as ProtectedFactRow[];
    return rows.map(mapFactRow);
  }

  saveLocalizations(articleId: string, locale: Locale, facts: ProtectedFact[], model: string): void {
    const save = this.db.transaction(() => {
      const canonicalRows = this.db.prepare(`
        SELECT * FROM protected_facts WHERE article_id = ?
      `).all(articleId) as ProtectedFactRow[];
      const canonicalByPlaceholder = new Map(canonicalRows.map((row) => [row.placeholder, row]));
      const now = nowIso();
      const upsert = this.db.prepare(`
        INSERT INTO protected_fact_localizations(
          id, fact_id, locale, value, normalized_value, model, created_at, updated_at
        ) VALUES (
          @id, @factId, @locale, @value, @normalizedValue, @model, @now, @now
        )
        ON CONFLICT(fact_id, locale) DO UPDATE SET
          value = excluded.value,
          normalized_value = excluded.normalized_value,
          model = excluded.model,
          updated_at = excluded.updated_at
      `);
      for (const fact of facts) {
        const canonical = canonicalByPlaceholder.get(fact.placeholder);
        if (!canonical) throw new Error(`Unknown fact placeholder ${fact.placeholder}`);
        upsert.run({
          id: createId("fact_locale"),
          factId: canonical.id,
          locale,
          value: fact.value,
          normalizedValue: fact.normalizedValue,
          model,
          now,
        });
      }
    });
    save();
  }

  listLocalizedForArticle(articleId: string, locale: Locale): LocalizedProtectedFact[] {
    const rows = this.db.prepare(`
      SELECT
        f.*,
        @locale AS locale,
        l.value AS localized_value,
        l.normalized_value AS localized_normalized_value,
        l.model AS localization_model
      FROM protected_facts f
      LEFT JOIN protected_fact_localizations l
        ON l.fact_id = f.id AND l.locale = @locale
      WHERE f.article_id = @articleId
      ORDER BY CASE f.source_field WHEN 'title' THEN 0 ELSE 1 END, f.start_index
    `).all({ articleId, locale }) as LocalizedProtectedFactRow[];
    return rows.map(mapLocalizedFactRow);
  }
}
