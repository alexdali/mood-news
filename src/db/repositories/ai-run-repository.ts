import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import type { AiModelRole, AiRunStatus, AiUsage } from "@/domain/ai/run";
import type { Locale } from "@/i18n/ui";

export type AiRunRecord = {
  articleId: string;
  model: string;
  modelRole: AiModelRole;
  status: AiRunStatus;
  locale: Locale;
  latencyMs: number;
  usage?: AiUsage;
  providerRequestId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export class AiRunRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  record(input: AiRunRecord): string {
    const id = createId("ai");
    this.db.prepare(`
      INSERT INTO ai_runs(
        id, article_id, model, model_role, status, locale, latency_ms,
        input_tokens, output_tokens, reasoning_tokens, cost_usd,
        provider_request_id, error_code, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.articleId,
      input.model,
      input.modelRole,
      input.status,
      input.locale,
      input.latencyMs,
      input.usage?.inputTokens ?? null,
      input.usage?.outputTokens ?? null,
      input.usage?.reasoningTokens ?? null,
      input.usage?.costUsd ?? null,
      input.providerRequestId ?? null,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      nowIso(),
    );
    return id;
  }

  costSince(iso: string): number {
    const row = this.db.prepare(`
      SELECT COALESCE(SUM(cost_usd), 0) AS cost
      FROM ai_runs
      WHERE created_at >= ? AND cost_usd IS NOT NULL
    `).get(iso) as { cost: number };
    return row.cost;
  }

  summaryLast24Hours(): { requests: number; failures: number; costUsd: number; averageLatencyMs: number } {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS requests,
        COALESCE(SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END), 0) AS failures,
        COALESCE(SUM(cost_usd), 0) AS cost,
        COALESCE(AVG(latency_ms), 0) AS avg_latency
      FROM ai_runs
      WHERE created_at >= ?
    `).get(since) as { requests: number; failures: number; cost: number; avg_latency: number };
    return {
      requests: row.requests,
      failures: row.failures,
      costUsd: row.cost,
      averageLatencyMs: Math.round(row.avg_latency),
    };
  }
}
