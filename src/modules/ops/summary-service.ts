import { getEnv } from "@/config/env";
import { NewsRepository } from "@/db/repositories/news-repository";
import { RewriteRepository } from "@/db/repositories/rewrite-repository";
import { IngestionRepository } from "@/db/repositories/ingestion-repository";
import { AiRunRepository } from "@/db/repositories/ai-run-repository";
import { MetricsRepository } from "@/db/repositories/metrics-repository";

export class OpsSummaryService {
  constructor(
    private readonly news = new NewsRepository(),
    private readonly rewrites = new RewriteRepository(),
    private readonly ingestions = new IngestionRepository(),
    private readonly aiRuns = new AiRunRepository(),
    private readonly metrics = new MetricsRepository(),
  ) {}

  get(input: { aiPage?: number; validationPage?: number; pageSize?: number } = {}) {
    const env = getEnv();
    const latestIngestion = this.ingestions.latest();
    const pageSize = Math.min(100, Math.max(10, input.pageSize ?? 25));
    const aiPage = Math.max(1, input.aiPage ?? 1);
    const validationPage = Math.max(1, input.validationPage ?? 1);
    return {
      articles: this.news.countActive(),
      validatedRewrites: this.rewrites.countValidated(env.AI_PROMPT_VERSION),
      latestIngestion,
      ingestionSchedule: latestIngestion ? {
        lastRequestedAt: latestIngestion.startedAt,
        nextRequestedAt: nextIngestionAt(latestIngestion.startedAt, env.INGEST_INTERVAL_MS),
        intervalMs: env.INGEST_INTERVAL_MS,
      } : null,
      aiLast24Hours: this.aiRuns.summaryLast24Hours(),
      validation: this.metrics.validationSummary(),
      validationFailures: {
        total: this.aiRuns.countValidationFailures(),
        page: validationPage,
        pageSize,
        rows: this.aiRuns.listValidationFailures(pageSize, (validationPage - 1) * pageSize),
      },
      aiAudit: {
        total: this.aiRuns.countAll(),
        page: aiPage,
        pageSize,
        rows: this.aiRuns.listRecent(pageSize, (aiPage - 1) * pageSize),
        costAllTime: this.aiRuns.costAllTime(),
        costByDay: this.aiRuns.costByDay(),
      },
      sources: this.metrics.sourceCounts(),
      models: {
        primary: env.AI_PRIMARY_MODEL,
        fallback: env.AI_FALLBACK_MODEL,
        promptVersion: env.AI_PROMPT_VERSION,
      },
    };
  }
}

export function nextIngestionAt(lastStartedAt: string, intervalMs: number): string {
  return new Date(Date.parse(lastStartedAt) + intervalMs).toISOString();
}
