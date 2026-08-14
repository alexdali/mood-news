import { rewriteResponseJsonSchema } from "@/modules/ai/schemas";

export const reasoningEfforts = ["low", "high", "max"] as const;
export type ReasoningEffort = (typeof reasoningEfforts)[number];

export type OpenRouterRequestInput = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  reasoningEnabled: boolean;
  reasoningEffort: ReasoningEffort;
  responseHealingEnabled: boolean;
};

export function buildReasoningConfig(enabled: boolean, effort: ReasoningEffort) {
  if (!enabled) {
    return { enabled: false, exclude: true } as const;
  }

  return { enabled: true, effort, exclude: true } as const;
}

export function buildOpenRouterRequest(input: OpenRouterRequestInput) {
  return {
    model: input.model,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt },
    ],
    temperature: input.temperature,
    max_tokens: input.maxOutputTokens,
    reasoning: buildReasoningConfig(input.reasoningEnabled, input.reasoningEffort),
    response_format: {
      type: "json_schema",
      json_schema: rewriteResponseJsonSchema,
    },
    provider: {
      // Structured-output support can vary by provider endpoint. This prevents
      // OpenRouter from routing the request to an endpoint that ignores JSON Schema.
      require_parameters: true,
    },
    ...(input.responseHealingEnabled ? { plugins: [{ id: "response-healing" }] } : {}),
  } as const;
}
