import { describe, expect, it } from "vitest";
import { buildOpenRouterRequest, buildReasoningConfig } from "@/modules/ai/openrouter-request";

const baseInput = {
  model: "deepseek/deepseek-v4-flash-0731",
  systemPrompt: "system",
  userPrompt: "user",
  temperature: 0.35,
  maxOutputTokens: 1_800,
  reasoningEnabled: false,
  reasoningEffort: "low" as const,
  responseHealingEnabled: false,
};

describe("OpenRouter request builder", () => {
  it("disables reasoning without sending an unsupported effort value", () => {
    expect(buildReasoningConfig(false, "low")).toEqual({ enabled: false, exclude: true });
    expect(buildReasoningConfig(false, "low")).not.toHaveProperty("effort");
  });

  it("adds the configured effort only when reasoning is enabled", () => {
    expect(buildReasoningConfig(true, "low")).toEqual({
      enabled: true,
      effort: "low",
      exclude: true,
    });
  });

  it("requires a provider endpoint that supports the JSON Schema parameters", () => {
    const request = buildOpenRouterRequest(baseInput);
    expect(request.provider.require_parameters).toBe(true);
    expect(request.response_format.type).toBe("json_schema");
    expect(request.response_format.json_schema.strict).toBe(true);
  });

  it("omits temperature for Luna because its OpenRouter endpoint does not support it", () => {
    const request = buildOpenRouterRequest({ ...baseInput, model: "openai/gpt-5.6-luna" });
    expect(request).not.toHaveProperty("temperature");
    expect(request.provider.require_parameters).toBe(true);
  });

  it("keeps temperature for models that advertise it", () => {
    expect(buildOpenRouterRequest(baseInput)).toHaveProperty("temperature", 0.35);
  });

  it("enables response healing only when explicitly configured", () => {
    expect(buildOpenRouterRequest(baseInput)).not.toHaveProperty("plugins");
    expect(buildOpenRouterRequest({ ...baseInput, responseHealingEnabled: true })).toMatchObject({
      plugins: [{ id: "response-healing" }],
    });
  });
});
