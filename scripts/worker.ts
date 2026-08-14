import "./_bootstrap-env";
import { getEnv } from "@/config/env";
import { StopSignal } from "@/core/stop-signal";
import { closeDatabase, getDatabase } from "@/db/client";
import { runIngestJob } from "@/modules/jobs/ingest-job";
import { runPeriodicTask } from "@/modules/jobs/periodic-runner";
import { runRewritePendingJob } from "@/modules/jobs/rewrite-job";
import { logger } from "@/server/logger";

const stopSignal = new StopSignal();
process.on("SIGINT", () => stopSignal.request());
process.on("SIGTERM", () => stopSignal.request());

async function runIngestionCycle(): Promise<void> {
  try {
    const ingestion = await runIngestJob("worker");
    logger.info({ ingestion }, "Ingestion cycle complete");
  } catch (error) {
    logger.error({ err: error }, "Ingestion cycle failed");
  }
}

async function runRewriteCycle(): Promise<void> {
  const env = getEnv();
  if (!env.OPENROUTER_API_KEY) {
    logger.warn("OPENROUTER_API_KEY is empty; rewrite cycle skipped");
    return;
  }
  try {
    const rewrites = await runRewritePendingJob(env.REWRITE_BATCH_SIZE);
    logger.info({ rewrites }, "Rewrite cycle complete");
  } catch (error) {
    logger.error({ err: error }, "Rewrite cycle failed");
  }
}

async function main(): Promise<void> {
  const env = getEnv();
  getDatabase();

  const runOnce = env.WORKER_RUN_ONCE || process.argv.includes("--once");
  const initialIngestionStartedAt = Date.now();
  await runIngestionCycle();
  const nextIngestionDelayMs = Math.max(
    1_000,
    env.INGEST_INTERVAL_MS - (Date.now() - initialIngestionStartedAt),
  );
  if (runOnce) {
    await runRewriteCycle();
    closeDatabase();
    logger.info("Worker stopped after one cycle");
    return;
  }

  // Ingestion already ran once. Schedule the next start five minutes after
  // the previous start (not five minutes after completion), while rewriting
  // begins immediately on an independent cadence.
  const runners: Array<Promise<void>> = [
    runPeriodicTask(runIngestionCycle, {
      intervalMs: env.INGEST_INTERVAL_MS,
      initialDelayMs: nextIngestionDelayMs,
      isStopping: () => stopSignal.isRequested(),
      wait: (timeoutMs) => stopSignal.wait(timeoutMs),
    }),
  ];
  if (env.OPENROUTER_API_KEY) {
    runners.push(runPeriodicTask(runRewriteCycle, {
      intervalMs: env.REWRITE_INTERVAL_MS,
      isStopping: () => stopSignal.isRequested(),
      wait: (timeoutMs) => stopSignal.wait(timeoutMs),
    }));
  } else {
    logger.warn("OPENROUTER_API_KEY is empty; periodic rewrite runner disabled");
  }
  await Promise.all(runners);

  closeDatabase();
  logger.info("Worker stopped");
}

main().catch((error) => {
  closeDatabase();
  logger.fatal({ err: error }, "Worker crashed");
  process.exit(1);
});
