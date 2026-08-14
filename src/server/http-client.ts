import { retryAsync } from "@/core/retry";

export class RetryableHttpError extends Error {
  constructor(public readonly response: Response) {
    super(`Retryable HTTP ${response.status}`);
    this.name = "RetryableHttpError";
  }
}

export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit,
  options: { timeoutMs: number; maxRetries?: number; baseDelayMs?: number } = { timeoutMs: 15_000 },
): Promise<Response> {
  return retryAsync(async () => {
    const response = await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (response.status === 429 || response.status >= 500) throw new RetryableHttpError(response);
    return response;
  }, (error) => error instanceof RetryableHttpError || error instanceof TypeError || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)), {
    maxRetries: options.maxRetries ?? 1,
    baseDelayMs: options.baseDelayMs ?? 600,
    maxDelayMs: 5_000,
  });
}
