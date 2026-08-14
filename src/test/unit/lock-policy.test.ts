import { describe, expect, it } from "vitest";
import { calculateRewriteLockTtlMs } from "@/modules/jobs/lock-policy";

describe("rewrite lock policy", () => {
  it("keeps a ten-minute minimum for tiny batches", () => {
    expect(calculateRewriteLockTtlMs({
      articleLimit: 1,
      modelCount: 1,
      requestTimeoutMs: 5_000,
      providerRetries: 0,
      retryBaseDelayMs: 500,
    })).toBe(10 * 60_000);
  });

  it("covers primary, fallback and provider retries for a full batch", () => {
    const ttl = calculateRewriteLockTtlMs({
      articleLimit: 20,
      modelCount: 2,
      requestTimeoutMs: 45_000,
      providerRetries: 1,
      retryBaseDelayMs: 600,
    });
    expect(ttl).toBeGreaterThan(60 * 60_000);
  });
});
