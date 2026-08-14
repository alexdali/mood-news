export type RewriteLockPolicyInput = {
  articleLimit: number;
  modelCount: number;
  requestTimeoutMs: number;
  providerRetries: number;
  retryBaseDelayMs: number;
};

/**
 * The rewrite lock must cover the worst application-level route, not just one
 * provider request. A batch can call primary and fallback for every article,
 * and each call can include provider retries.
 */
export function calculateRewriteLockTtlMs(input: RewriteLockPolicyInput): number {
  const attemptsPerModel = input.providerRetries + 1;
  const retryDelayBudget = input.providerRetries <= 0
    ? 0
    : Array.from({ length: input.providerRetries }, (_, index) => input.retryBaseDelayMs * 2 ** index)
      .reduce((sum, delay) => sum + delay, 0);
  const oneModelBudget = input.requestTimeoutMs * attemptsPerModel + retryDelayBudget + 2_000;
  const batchBudget = Math.max(1, input.articleLimit) * Math.max(1, input.modelCount) * oneModelBudget;
  return Math.max(10 * 60_000, batchBudget + 60_000);
}
