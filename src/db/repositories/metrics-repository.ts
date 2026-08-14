import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";

export class MetricsRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  validationSummary(): { total: number; passed: number; passRate: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS passed
      FROM ai_runs
      WHERE status IN ('completed', 'validation_error')
    `).get() as { total: number; passed: number | null };
    const passed = row.passed ?? 0;
    return {
      total: row.total,
      passed,
      passRate: row.total === 0 ? 0 : passed / row.total,
    };
  }

  sourceCounts(): Array<{ sourceId: string; sourceName: string; articleCount: number }> {
    return this.db.prepare(`
      SELECT s.id AS sourceId, s.name AS sourceName, COUNT(a.id) AS articleCount
      FROM sources s
      LEFT JOIN news_articles a ON a.source_id = s.id AND a.status = 'active'
      GROUP BY s.id, s.name
      ORDER BY articleCount DESC
    `).all() as Array<{ sourceId: string; sourceName: string; articleCount: number }>;
  }
}
