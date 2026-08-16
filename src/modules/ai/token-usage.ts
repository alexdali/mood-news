import type { AiUsage } from "@/domain/ai/run";
import type { OpenRouterModelResponse } from "@/modules/ai/ai-types";

export function mapOpenRouterUsage(response: OpenRouterModelResponse): AiUsage {
  return {
    inputTokens: response.usage?.prompt_tokens ?? null,
    outputTokens: response.usage?.completion_tokens ?? null,
    reasoningTokens: response.usage?.completion_tokens_details?.reasoning_tokens ?? null,
    cachedInputTokens: response.usage?.prompt_tokens_details?.cached_tokens ?? null,
    cacheWriteTokens: response.usage?.prompt_tokens_details?.cache_write_tokens ?? null,
    costUsd: response.usage?.cost ?? null,
  };
}
