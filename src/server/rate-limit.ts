type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let checksSinceCleanup = 0;

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  input: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number; resetAt: number } {
  if (input.limit < 1 || input.windowMs < 1) {
    throw new RangeError("Rate-limit values must be positive");
  }

  const now = Date.now();
  checksSinceCleanup += 1;
  if (checksSinceCleanup >= 100 || buckets.size >= 10_000) {
    pruneExpiredBuckets(now);
    checksSinceCleanup = 0;
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + input.windowMs };
    buckets.set(key, next);
    return { allowed: true, remaining: input.limit - 1, resetAt: next.resetAt };
  }
  if (current.count >= input.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { allowed: true, remaining: input.limit - current.count, resetAt: current.resetAt };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
  checksSinceCleanup = 0;
}
