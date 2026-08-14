import { sleep } from "@/core/time";

export type RetryOptions = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  jitterRatio?: number;
};

export function retryDelay(attempt: number, options: RetryOptions): number {
  const ceiling = options.maxDelayMs ?? 10_000;
  const exponential = Math.min(options.baseDelayMs * 2 ** attempt, ceiling);
  const jitterRatio = options.jitterRatio ?? 0.2;
  const jitter = exponential * jitterRatio * Math.random();
  return Math.round(exponential + jitter);
}

export async function retryAsync<T>(
  operation: (attempt: number) => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= options.maxRetries || !shouldRetry(error, attempt)) throw error;
      await sleep(retryDelay(attempt, options));
    }
  }
  throw lastError;
}
