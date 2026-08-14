import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import type { ProtectedFact } from "@/domain/fact-lock/fact";
import type { ProtectedFactRow } from "@/db/schema";
import { mapFactRow } from "@/db/row-mappers";

export class FactRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  replaceForArticle(articleId: string, facts: ProtectedFact[]): void {
    const replace = this.db.transaction(() => {
      this.db.prepare("DELETE FROM protected_facts WHERE article_id = ?").run(articleId);
      const insert = this.db.prepare(`
        INSERT INTO protected_facts(
          id, article_id, fact_type, value, normalized_value, placeholder,
          source_field, start_index, end_index, extractor, created_at
        ) VALUES (
          @id, @articleId, @factType, @value, @normalizedValue, @placeholder,
          @sourceField, @startIndex, @endIndex, @extractor, @createdAt
        )
      `);
      for (const fact of facts) insert.run(fact);
    });
    replace();
  }

  listForArticle(articleId: string): ProtectedFact[] {
    const rows = this.db.prepare(`
      SELECT * FROM protected_facts
      WHERE article_id = ?
      ORDER BY source_field, start_index
    `).all(articleId) as ProtectedFactRow[];
    return rows.map(mapFactRow);
  }
}
