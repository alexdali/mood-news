export type AiModelRole = "primary" | "fallback" | "benchmark";
export type AiRunStatus = "completed" | "api_error" | "parse_error" | "validation_error" | "budget_blocked";

export type AiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  costUsd: number | null;
};
