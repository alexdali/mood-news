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
  const pendingByLocale = env.AI_REWRITE_LOCALES.map((locale) => ({
    locale,
    articles: news.listPendingForPrompt(env.AI_PROMPT_VERSION, locale, moods.length, boundedLimit),
  }));
  const pending: Array<{ article: (typeof pendingByLocale)[number]["articles"][number]; locale: (typeof pendingByLocale)[number]["locale"] }> = [];
  for (let index = 0; pending.length < boundedLimit; index += 1) {
    let found = false;
    for (const group of pendingByLocale) {
      const article = group.articles[index];
      if (!article) continue;
      pending.push({ article, locale: group.locale });
      found = true;
      if (pending.length === boundedLimit) break;
    }
    if (!found) break;
  }
  let processed = 0;
  let succeeded = 0;
  let budgetBlocked = false;
  const errors: string[] = [];
  try {
    for (const { article, locale } of pending) {
      processed += 1;
      try {
        await service.rewriteArticle(article, locale);
        succeeded += 1;
      } catch (error) {
        const message = `${article.id}/${locale}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(message);
        logger.warn({ err: error, articleId: article.id, locale }, "Pending rewrite failed");
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
