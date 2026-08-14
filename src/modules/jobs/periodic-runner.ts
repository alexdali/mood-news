export type PeriodicRunnerOptions = {
  intervalMs: number;
  initialDelayMs?: number;
  isStopping: () => boolean;
  wait: (timeoutMs: number) => Promise<void>;
  now?: () => number;
  minimumDelayMs?: number;
};

/**
 * Runs one task on its own cadence. Keeping ingestion and rewriting in separate
 * runners means a slow AI batch cannot postpone the next source poll.
 */
export async function runPeriodicTask(
  task: () => Promise<void>,
  options: PeriodicRunnerOptions,
): Promise<void> {
  const now = options.now ?? Date.now;
  const minimumDelayMs = options.minimumDelayMs ?? 1_000;
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? 0);

  if (initialDelayMs > 0) await options.wait(initialDelayMs);

  while (!options.isStopping()) {
    const startedAt = now();
    await task();
    if (options.isStopping()) break;
    const elapsedMs = Math.max(0, now() - startedAt);
    await options.wait(Math.max(minimumDelayMs, options.intervalMs - elapsedMs));
  }
}
