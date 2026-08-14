import { getEnv } from "@/config/env";
import { moods } from "@/domain/news/mood";
import { createId } from "@/core/ids";
import { JobLockRepository } from "@/db/repositories/job-lock-repository";
import { NewsRepository } from "@/db/repositories/news-repository";
import { RewriteService } from "@/modules/ai/rewrite-service";
import { logger } from "@/server/logger";
import { calculateRewriteLockTtlMs } from "@/modules/jobs/lock-policy";
import { BudgetExceededError } from "@/core/errors";

export async function runRewritePendingJob(limit = getEnv().REWRITE_BATCH_SIZE) {
  const env = getEnv();
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const owner = createId("worker");
  const locks = new JobLockRepository();
  const modelCount = env.AI_PRIMARY_MODEL === env.AI_FALLBACK_MODEL ? 1 : 2;
  const lockTtlMs = calculateRewriteLockTtlMs({
    articleLimit: boundedLimit,
    modelCount,
    requestTimeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    providerRetries: env.AI_MAX_PROVIDER_RETRIES,
    retryBaseDelayMs: env.AI_RETRY_BASE_DELAY_MS,
  });
  if (!locks.acquire("rewrite-pending", owner, lockTtlMs)) {
    return { acquired: false, selected: 0, processed: 0, succeeded: 0, failed: 0, budgetBlocked: false, errors: [] as string[] };
  }

  const news = new NewsRepository();
  const service = new RewriteService();
  const pending = news.listPendingForPrompt(env.AI_PROMPT_VERSION, moods.length, boundedLimit);
  let processed = 0;
  let succeeded = 0;
  let budgetBlocked = false;
  const errors: string[] = [];
  try {
    for (const article of pending) {
      processed += 1;
      try {
        await service.rewriteArticle(article);
        succeeded += 1;
      } catch (error) {
        const message = `${article.id}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(message);
        logger.warn({ err: error, articleId: article.id }, "Pending rewrite failed");
        if (error instanceof BudgetExceededError) {
          budgetBlocked = true;
          break;
        }
      }
    }
    return {
      acquired: true,
      selected: pending.length,
      processed,
      succeeded,
      failed: errors.length,
      budgetBlocked,
      errors,
    };
  } finally {
    locks.release("rewrite-pending", owner);
  }
}
