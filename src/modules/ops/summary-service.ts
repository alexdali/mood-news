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

  get() {
    const env = getEnv();
    return {
      articles: this.news.countActive(),
      validatedRewrites: this.rewrites.countValidated(env.AI_PROMPT_VERSION),
      latestIngestion: this.ingestions.latest(),
      aiLast24Hours: this.aiRuns.summaryLast24Hours(),
      validation: this.metrics.validationSummary(),
      sources: this.metrics.sourceCounts(),
      models: {
        primary: env.AI_PRIMARY_MODEL,
        fallback: env.AI_FALLBACK_MODEL,
        promptVersion: env.AI_PROMPT_VERSION,
      },
    };
  }
}
