export type AiModelRole = "primary" | "fallback" | "benchmark";
export type AiRunStatus = "completed" | "api_error" | "parse_error" | "validation_error" | "budget_blocked";

export type AiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  costUsd: number | null;
};

export type AiValidationDetails =
  | { stage: "fact_localization"; issues: string[] }
  | {
    stage: "fact_lock";
    variants: Array<{
      mood: string;
      score: number;
      expectedCount: number;
      preservedCount: number;
      missing: string[];
      duplicates: string[];
      unknown: string[];
      addedFacts: string[];
      issues: Array<{ code: string; message: string; field?: "title" | "summary"; values?: string[] }>;
    }>;
  };

export type AiRunAudit = {
  id: string;
  articleId: string;
  articleTitle: string;
  model: string;
  modelRole: AiModelRole;
  status: AiRunStatus;
  locale: "en" | "ru";
  promptVersion: string;
  latencyMs: number;
  usage: AiUsage;
  cacheStatus: string | null;
  providerRequestId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  systemPrompt: string | null;
  userPrompt: string | null;
  responseText: string | null;
  validationDetails: AiValidationDetails | null;
  createdAt: string;
};

export type AiDailyCost = {
  day: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  costUsd: number;
};
