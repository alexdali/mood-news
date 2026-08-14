import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "@/server/rate-limit";

afterEach(() => {
  vi.useRealTimers();
  resetRateLimitsForTests();
});

describe("in-memory rate limiter", () => {
  it("allows requests until the window limit and then blocks", () => {
    const first = checkRateLimit("key", { limit: 2, windowMs: 1_000 });
    const second = checkRateLimit("key", { limit: 2, windowMs: 1_000 });
    const third = checkRateLimit("key", { limit: 2, windowMs: 1_000 });

    expect(first).toMatchObject({ allowed: true, remaining: 1 });
    expect(second).toMatchObject({ allowed: true, remaining: 0 });
    expect(third).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("opens a new bucket after the window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T10:00:00Z"));
    checkRateLimit("key", { limit: 1, windowMs: 1_000 });
    expect(checkRateLimit("key", { limit: 1, windowMs: 1_000 }).allowed).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit("key", { limit: 1, windowMs: 1_000 }).allowed).toBe(true);
  });

  it("rejects invalid configuration", () => {
    expect(() => checkRateLimit("key", { limit: 0, windowMs: 1_000 })).toThrow(RangeError);
  });
});
