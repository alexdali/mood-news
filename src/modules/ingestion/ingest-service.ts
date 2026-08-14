import { IngestionRepository } from "@/db/repositories/ingestion-repository";
import { NewsRepository } from "@/db/repositories/news-repository";
import { SourceRepository } from "@/db/repositories/source-repository";
import { EventRepository } from "@/db/repositories/event-repository";
import type { NewsSourceAdapter } from "@/modules/ingestion/source-adapter";
import { normalizeNewsItem } from "@/modules/ingestion/normalize";
import { deduplicateItems } from "@/modules/ingestion/deduplicate";
import { logger } from "@/server/logger";
import type { IngestionRunSummary } from "@/domain/ingestion/run";

export class IngestService {
  constructor(
    private readonly sources: NewsSourceAdapter[],
    private readonly sourceRepository = new SourceRepository(),
    private readonly newsRepository = new NewsRepository(),
    private readonly ingestionRepository = new IngestionRepository(),
    private readonly eventRepository = new EventRepository(),
  ) {}

  async run(triggerType: string): Promise<IngestionRunSummary> {
    const runId = this.ingestionRepository.startRun(triggerType);
    const total = { fetchedCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, errorCount: 0 };
    const errors: Array<{ sourceId: string; message: string }> = [];

    for (const source of this.sources) {
      this.sourceRepository.upsert(source.metadata);
      const sourceRunId = this.ingestionRepository.startSourceRun(runId, source.metadata.id);
      const counters = { fetchedCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0 };
      try {
        const fetched = await source.fetchLatest();
        const normalized = deduplicateItems(
          fetched.items.map((item) => normalizeNewsItem(item)).filter((item): item is NonNullable<typeof item> => item !== null),
        );
        counters.fetchedCount = normalized.length;
        total.fetchedCount += normalized.length;

        for (const item of normalized) {
          const result = this.newsRepository.upsert({
            sourceId: item.sourceId,
            sourceItemId: item.sourceItemId,
            canonicalUrl: item.canonicalUrl,
            title: item.title,
            summary: item.summary,
            section: item.section,
            language: item.language,
            imageUrl: item.imageUrl,
            byline: item.byline,
            publishedAt: item.publishedAt,
            fetchedAt: item.fetchedAt,
            contentHash: item.contentHash,
            rawPayload: item.rawPayload,
          });
          if (result.outcome === "inserted") counters.insertedCount += 1;
          if (result.outcome === "updated") counters.updatedCount += 1;
          if (result.outcome === "skipped") counters.skippedCount += 1;
        }

        total.insertedCount += counters.insertedCount;
        total.updatedCount += counters.updatedCount;
        total.skippedCount += counters.skippedCount;
        this.ingestionRepository.finishSourceRun(sourceRunId, { ...counters, status: "completed" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        total.errorCount += 1;
        errors.push({ sourceId: source.metadata.id, message });
        this.ingestionRepository.finishSourceRun(sourceRunId, { ...counters, status: "failed", errorMessage: message });
        logger.warn({ err: error, sourceId: source.metadata.id }, "News source failed");
      }
    }

    const status = total.errorCount === 0 ? "completed" : total.errorCount < this.sources.length ? "partial" : "failed";
    this.ingestionRepository.finishRun(runId, status, total, errors);
    this.eventRepository.record("ingestion.completed", { entityType: "ingestion_run", entityId: runId, payload: { status, ...total } });
    const latest = this.ingestionRepository.latest();
    if (!latest) throw new Error("Ingestion run disappeared after completion");
    return latest;
  }
}
