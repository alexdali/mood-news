import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "@/config/env";
import type { AiRunRecord } from "@/db/repositories/ai-run-repository";
import { moods } from "@/domain/news/mood";
import type { ModelCallResult } from "@/modules/ai/ai-types";
import type { AiModelClient } from "@/modules/ai/openrouter-client";
import { ModelRouter, type AiRunRecorder } from "@/modules/ai/model-router";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { sourceSummary, sourceTitle } from "@/test/fixtures/articles";

class Recorder implements AiRunRecorder {
  readonly records: AiRunRecord[] = [];
  record(input: AiRunRecord): string {
    this.records.push(input);
    return `run_${this.records.length}`;
  }
}

class FakeClient implements AiModelClient {
  readonly calls: string[] = [];
  constructor(private readonly primaryMode: "throw" | "invalid") {}

  async rewrite(input: { model: string }): Promise<ModelCallResult> {
    this.calls.push(input.model);
    if (input.model === "primary-model" && this.primaryMode === "throw") throw new Error("primary unavailable");

    const protectedText = currentProtectedText;
    const invalidTitle = protectedText.title.replace(protectedText.facts[0]?.placeholder ?? "", "");
    return {
      model: input.model,
      providerRequestId: `request_${input.model}`,
      rawContent: "{}",
      payload: {
        localizedFacts: protectedText.facts.map((fact) => ({
          placeholder: fact.placeholder,
          value: fact.value,
        })),
        variants: moods.map((mood) => ({
          mood,
          title: input.model === "primary-model" && this.primaryMode === "invalid" ? invalidTitle : protectedText.title,
          summary: protectedText.summary,
        })),
      },
      usage: {
        inputTokens: 100,
        outputTokens: 100,
        reasoningTokens: 0,
        cachedInputTokens: 40,
        cacheWriteTokens: 0,
        costUsd: 0.001,
      },
      cacheStatus: null,
      latencyMs: 5,
    };
  }
}

let currentProtectedText = protectArticleText("article_test", sourceTitle, sourceSummary);
const originalPrimaryModel = process.env.AI_PRIMARY_MODEL;
const originalFallbackModel = process.env.AI_FALLBACK_MODEL;

beforeEach(() => {
  process.env.AI_PRIMARY_MODEL = "primary-model";
  process.env.AI_FALLBACK_MODEL = "fallback-model";
  resetEnvForTests();
  currentProtectedText = protectArticleText("article_test", sourceTitle, sourceSummary);
});

afterAll(() => {
  if (originalPrimaryModel === undefined) delete process.env.AI_PRIMARY_MODEL;
  else process.env.AI_PRIMARY_MODEL = originalPrimaryModel;
  if (originalFallbackModel === undefined) delete process.env.AI_FALLBACK_MODEL;
  else process.env.AI_FALLBACK_MODEL = originalFallbackModel;
  resetEnvForTests();
});

describe("application-level model routing", () => {
  it("falls back after a provider error", async () => {
    const client = new FakeClient("throw");
    const recorder = new Recorder();
    const result = await new ModelRouter(client, recorder).generate({
      articleId: "article_test",
      protectedText: currentProtectedText,
      targetLocale: "en",
      systemPrompt: "system",
      userPrompt: "user",
    });
    expect(result.model).toBe("fallback-model");
    expect(result.localizedFacts.map((fact) => fact.value)).toEqual(currentProtectedText.facts.map((fact) => fact.value));
    expect(client.calls).toEqual(["primary-model", "fallback-model"]);
    expect(recorder.records.map((record) => record.status)).toEqual(["api_error", "completed"]);
    expect(recorder.records[1]).toMatchObject({ systemPrompt: "system", userPrompt: "user", responseText: "{}" });
  });

  it("falls back after deterministic Fact Lock rejection", async () => {
    const client = new FakeClient("invalid");
    const recorder = new Recorder();
    const result = await new ModelRouter(client, recorder).generate({
      articleId: "article_test",
      protectedText: currentProtectedText,
      targetLocale: "en",
      systemPrompt: "system",
      userPrompt: "user",
    });
    expect(result.model).toBe("fallback-model");
    expect(recorder.records.map((record) => record.status)).toEqual(["validation_error", "completed"]);
    expect(recorder.records[0]?.validationDetails).toMatchObject({ stage: "fact_lock" });
  });
});
