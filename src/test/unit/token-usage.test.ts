import { describe, expect, it } from "vitest";
import { mapOpenRouterUsage } from "@/modules/ai/token-usage";

describe("OpenRouter token usage", () => {
  it("maps prompt cache reads and writes", () => {
    expect(mapOpenRouterUsage({
      usage: {
        prompt_tokens: 1_200,
        completion_tokens: 180,
        cost: 0.0042,
        prompt_tokens_details: { cached_tokens: 900, cache_write_tokens: 100 },
        completion_tokens_details: { reasoning_tokens: 25 },
      },
    })).toEqual({
      inputTokens: 1_200,
      outputTokens: 180,
      reasoningTokens: 25,
      cachedInputTokens: 900,
      cacheWriteTokens: 100,
      costUsd: 0.0042,
    });
  });
});
