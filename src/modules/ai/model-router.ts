import { getEnv } from "@/config/env";
import type { Mood } from "@/domain/news/mood";
import type { ProtectedArticleText } from "@/domain/fact-lock/fact";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import type { AiModelRole, AiRunStatus } from "@/domain/ai/run";
import { AiRunRepository, type AiRunRecord } from "@/db/repositories/ai-run-repository";
import type { AiModelClient } from "@/modules/ai/openrouter-client";
import { AiResponseParseError, OpenRouterClient } from "@/modules/ai/openrouter-client";
import type { ValidatedModelResult } from "@/modules/ai/ai-types";
import { validateProtectedVariant } from "@/modules/fact-lock/validator";
import { logger } from "@/server/logger";
import type { Locale } from "@/i18n/ui";

export interface AiRunRecorder {
  record(input: AiRunRecord): string;
}

export class ModelRouter {
  constructor(
    private readonly client: AiModelClient = new OpenRouterClient(),
    private readonly aiRuns: AiRunRecorder = new AiRunRepository(),
  ) {}

  async generate(input: {
    articleId: string;
    protectedText: ProtectedArticleText;
    original: { title: string; summary: string };
    targetLocale: Locale;
    systemPrompt: string;
    userPrompt: string;
  }): Promise<ValidatedModelResult> {
    const env = getEnv();
    const attempts: Array<{ model: string; role: AiModelRole }> = [
      { model: env.AI_PRIMARY_MODEL, role: "primary" },
      ...(env.AI_FALLBACK_MODEL !== env.AI_PRIMARY_MODEL
        ? [{ model: env.AI_FALLBACK_MODEL, role: "fallback" as const }]
        : []),
    ];
    let lastError: unknown;

    for (const attempt of attempts) {
      const startedAt = Date.now();
      try {
        const result = await this.client.rewrite({
          model: attempt.model,
          systemPrompt: input.systemPrompt,
          userPrompt: input.userPrompt,
        });
        const validations = new Map<Mood, FactValidationResult>();
        for (const variant of result.payload.variants) {
          validations.set(variant.mood, validateProtectedVariant({
            protectedText: input.protectedText,
            original: input.original,
            output: { title: variant.title, summary: variant.summary },
            targetLocale: input.targetLocale,
          }));
        }
        const failed = [...validations.entries()].filter(([, validation]) => !validation.passed);
        if (failed.length > 0) {
          this.aiRuns.record({
            articleId: input.articleId,
            model: result.model,
            modelRole: attempt.role,
            status: "validation_error",
            locale: input.targetLocale,
            latencyMs: result.latencyMs,
            usage: result.usage,
            providerRequestId: result.providerRequestId,
            errorCode: "FACT_LOCK_REJECTED",
            errorMessage: failed.map(([mood, validation]) => `${mood}: ${validation.issues.map((issue) => issue.code).join(",")}`).join("; "),
          });
          lastError = new Error(`Fact Lock rejected ${attempt.model}`);
          logger.warn({ model: attempt.model, failed: [...failed.keys()] }, "Model output failed Fact Lock; trying fallback");
          continue;
        }

        this.aiRuns.record({
          articleId: input.articleId,
          model: result.model,
          modelRole: attempt.role,
          status: "completed",
          locale: input.targetLocale,
          latencyMs: result.latencyMs,
          usage: result.usage,
          providerRequestId: result.providerRequestId,
        });
        return { ...result, validations };
      } catch (error) {
        const status = classifyError(error);
        this.aiRuns.record({
          articleId: input.articleId,
          model: error instanceof AiResponseParseError ? error.providerModel : attempt.model,
          modelRole: attempt.role,
          status,
          locale: input.targetLocale,
          latencyMs: Date.now() - startedAt,
          usage: error instanceof AiResponseParseError ? error.usage : undefined,
          providerRequestId: error instanceof AiResponseParseError ? error.providerRequestId : undefined,
          errorCode: error instanceof Error ? error.name : "UNKNOWN",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        lastError = error;
        logger.warn({ err: error, model: attempt.model, role: attempt.role }, "AI attempt failed; trying next model");
      }
    }

    throw lastError instanceof Error ? lastError : new Error("All configured AI models failed");
  }
}

function classifyError(error: unknown): AiRunStatus {
  if (error instanceof SyntaxError) return "parse_error";
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") return "parse_error";
  return "api_error";
}
