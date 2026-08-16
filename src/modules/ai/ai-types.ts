import type { Mood } from "@/domain/news/mood";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import type { AiUsage } from "@/domain/ai/run";
import type { LocalizedFactCandidate, ProtectedFact } from "@/domain/fact-lock/fact";

export type AiRewriteVariant = {
  mood: Mood;
  title: string;
  summary: string;
};

export type AiRewritePayload = {
  localizedFacts: LocalizedFactCandidate[];
  variants: AiRewriteVariant[];
};

export type OpenRouterModelResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
  error?: {
    code?: number | string;
    message?: string;
    metadata?: unknown;
  };
};

export type ModelCallResult = {
  model: string;
  providerRequestId: string | null;
  rawContent: string;
  payload: AiRewritePayload;
  usage: AiUsage;
  latencyMs: number;
};

export type ValidatedModelResult = ModelCallResult & {
  localizedFacts: ProtectedFact[];
  validations: Map<Mood, FactValidationResult>;
};
