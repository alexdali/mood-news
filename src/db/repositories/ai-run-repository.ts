import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import type { AiModelRole, AiRunStatus, AiUsage } from "@/domain/ai/run";
import type { AiDailyCost, AiRunAudit, AiValidationDetails } from "@/domain/ai/run";
import type { Locale } from "@/i18n/ui";
import { parseJson } from "@/core/json";

export type AiRunRecord = {
  articleId: string;
  model: string;
  modelRole: AiModelRole;
  status: AiRunStatus;
  locale: Locale;
  promptVersion: string;
  latencyMs: number;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  responseText?: string | null;
  validationDetails?: AiValidationDetails | null;
  cacheStatus?: string | null;
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
        id, article_id, model, model_role, status, locale, prompt_version, latency_ms,
        input_tokens, output_tokens, reasoning_tokens, cached_input_tokens,
        cache_write_tokens, cost_usd, cache_status, provider_request_id,
        error_code, error_message, system_prompt, user_prompt, response_text,
        validation_details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.articleId,
      input.model,
      input.modelRole,
      input.status,
      input.locale,
      input.promptVersion,
      input.latencyMs,
      input.usage?.inputTokens ?? null,
      input.usage?.outputTokens ?? null,
      input.usage?.reasoningTokens ?? null,
      input.usage?.cachedInputTokens ?? null,
      input.usage?.cacheWriteTokens ?? null,
      input.usage?.costUsd ?? null,
      input.cacheStatus ?? null,
      input.providerRequestId ?? null,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      input.systemPrompt ?? null,
      input.userPrompt ?? null,
      input.responseText ?? null,
      input.validationDetails ? JSON.stringify(input.validationDetails) : null,
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

  countAll(): number {
    return (this.db.prepare("SELECT COUNT(*) AS count FROM ai_runs").get() as { count: number }).count;
  }

  countValidationFailures(): number {
    return (this.db.prepare("SELECT COUNT(*) AS count FROM ai_runs WHERE status = 'validation_error'").get() as { count: number }).count;
  }

  costAllTime(): number {
    return (this.db.prepare("SELECT COALESCE(SUM(cost_usd), 0) AS cost FROM ai_runs").get() as { cost: number }).cost;
  }

  costByDay(): AiDailyCost[] {
    return this.db.prepare(`
      SELECT
        substr(created_at, 1, 10) AS day,
        COUNT(*) AS requests,
        COALESCE(SUM(input_tokens), 0) AS inputTokens,
        COALESCE(SUM(output_tokens), 0) AS outputTokens,
        COALESCE(SUM(cached_input_tokens), 0) AS cachedInputTokens,
        COALESCE(SUM(cost_usd), 0) AS costUsd
      FROM ai_runs
      GROUP BY substr(created_at, 1, 10)
      ORDER BY day DESC
    `).all() as AiDailyCost[];
  }

  listRecent(limit: number, offset = 0): AiRunAudit[] {
    return this.listAuditRows("", [], limit, offset);
  }

  listValidationFailures(limit: number, offset = 0): AiRunAudit[] {
    return this.listAuditRows("WHERE ar.status = ?", ["validation_error"], limit, offset);
  }

  private listAuditRows(where: string, parameters: unknown[], limit: number, offset: number): AiRunAudit[] {
    const rows = this.db.prepare(`
      SELECT ar.*, a.title AS article_title
      FROM ai_runs ar
      JOIN news_articles a ON a.id = ar.article_id
      ${where}
      ORDER BY ar.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...parameters, limit, offset) as AiRunAuditRow[];
    return rows.map(mapAiRunAuditRow);
  }
}

type AiRunAuditRow = {
  id: string;
  article_id: string;
  article_title: string;
  model: string;
  model_role: AiModelRole;
  status: AiRunStatus;
  locale: Locale;
  prompt_version: string;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  reasoning_tokens: number | null;
  cached_input_tokens: number | null;
  cache_write_tokens: number | null;
  cost_usd: number | null;
  cache_status: string | null;
  provider_request_id: string | null;
  error_code: string | null;
  error_message: string | null;
  system_prompt: string | null;
  user_prompt: string | null;
  response_text: string | null;
  validation_details_json: string | null;
  created_at: string;
};

function mapAiRunAuditRow(row: AiRunAuditRow): AiRunAudit {
  return {
    id: row.id,
    articleId: row.article_id,
    articleTitle: row.article_title,
    model: row.model,
    modelRole: row.model_role,
    status: row.status,
    locale: row.locale,
    promptVersion: row.prompt_version,
    latencyMs: row.latency_ms,
    usage: {
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      reasoningTokens: row.reasoning_tokens,
      cachedInputTokens: row.cached_input_tokens,
      cacheWriteTokens: row.cache_write_tokens,
      costUsd: row.cost_usd,
    },
    cacheStatus: row.cache_status,
    providerRequestId: row.provider_request_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    systemPrompt: row.system_prompt,
    userPrompt: row.user_prompt,
    responseText: row.response_text,
    validationDetails: row.validation_details_json
      ? parseJson<AiValidationDetails | null>(row.validation_details_json, null)
      : null,
    createdAt: row.created_at,
  };
}
