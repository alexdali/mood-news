import { getEnv } from "@/config/env";
import { ConfigurationError, ExternalServiceError } from "@/core/errors";
import { extractJsonObject } from "@/modules/ai/json-repair";
import { rewritePayloadSchema } from "@/modules/ai/schemas";
import type { ModelCallResult, OpenRouterModelResponse } from "@/modules/ai/ai-types";
import type { AiUsage } from "@/domain/ai/run";
import { mapOpenRouterUsage } from "@/modules/ai/token-usage";
import { fetchWithRetry } from "@/server/http-client";
import { buildOpenRouterRequest } from "@/modules/ai/openrouter-request";

export class AiResponseParseError extends SyntaxError {
  constructor(
    message: string,
    public readonly usage: AiUsage,
    public readonly providerRequestId: string | null,
    public readonly providerModel: string,
  ) {
    super(message);
    this.name = "AiResponseParseError";
  }
}

export interface AiModelClient {
  rewrite(input: { model: string; systemPrompt: string; userPrompt: string }): Promise<ModelCallResult>;
}

export class OpenRouterClient implements AiModelClient {
  async rewrite(input: { model: string; systemPrompt: string; userPrompt: string }): Promise<ModelCallResult> {
    const env = getEnv();
    if (!env.OPENROUTER_API_KEY) {
      throw new ConfigurationError("OPENROUTER_API_KEY is required to generate rewrites");
    }

    const startedAt = Date.now();
    const body = buildOpenRouterRequest({
      model: input.model,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      temperature: env.AI_TEMPERATURE,
      maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
      reasoningEnabled: env.AI_REASONING_ENABLED,
      reasoningEffort: env.AI_REASONING_EFFORT,
      responseHealingEnabled: env.AI_ENABLE_RESPONSE_HEALING,
    });

    let response: Response;
    try {
      response = await fetchWithRetry(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.OPENROUTER_SITE_URL,
          "X-OpenRouter-Title": env.OPENROUTER_APP_NAME,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }, {
        timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
        maxRetries: env.AI_MAX_PROVIDER_RETRIES,
        baseDelayMs: env.AI_RETRY_BASE_DELAY_MS,
      });
    } catch (error) {
      throw new ExternalServiceError("OpenRouter", error instanceof Error ? error.message : String(error), { model: input.model });
    }

    const responseText = await response.text();
    let payload: OpenRouterModelResponse;
    try {
      payload = JSON.parse(responseText) as OpenRouterModelResponse;
    } catch {
      throw new ExternalServiceError(
        "OpenRouter",
        `HTTP ${response.status} returned a non-JSON response`,
        { status: response.status, model: input.model, responsePreview: responseText.slice(0, 500) },
      );
    }

    if (!response.ok || payload.error) {
      throw new ExternalServiceError(
        "OpenRouter",
        payload.error?.message ?? `HTTP ${response.status}`,
        { status: response.status, code: payload.error?.code, metadata: payload.error?.metadata, model: input.model },
      );
    }

    const providerModel = payload.model ?? input.model;
    const providerRequestId = payload.id ?? null;
    const usage = mapOpenRouterUsage(payload);
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new AiResponseParseError("Model returned empty content", usage, providerRequestId, providerModel);
    }

    try {
      const parsedJson = JSON.parse(extractJsonObject(content)) as unknown;
      const parsed = rewritePayloadSchema.parse(parsedJson);
      return {
        model: providerModel,
        providerRequestId,
        rawContent: content,
        payload: parsed,
        usage,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new AiResponseParseError(`Invalid structured model output: ${reason}`, usage, providerRequestId, providerModel);
    }
  }
}
