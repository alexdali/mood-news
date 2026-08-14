import "./_bootstrap-env";
import { getEnv } from "@/config/env";
import { fail, heading } from "./_console";

type ModelReasoning = {
  supported_efforts?: string[] | null;
  default_effort?: string | null;
  default_enabled?: boolean;
  mandatory?: boolean;
  supports_max_tokens?: boolean;
};

type OpenRouterModel = {
  id: string;
  context_length?: number;
  pricing?: Record<string, string>;
  supported_parameters?: string[];
  reasoning?: ModelReasoning;
};

type ModelsResponse = { data?: OpenRouterModel[] };

function supportsStructuredOutputs(model: OpenRouterModel): boolean {
  const supported = new Set(model.supported_parameters ?? []);
  return supported.has("response_format") || supported.has("structured_outputs");
}

function validateReasoning(model: OpenRouterModel): string[] {
  const env = getEnv();
  const issues: string[] = [];
  const reasoning = model.reasoning;

  if (!reasoning) {
    if (env.AI_REASONING_ENABLED) {
      issues.push("reasoning is enabled locally, but the model exposes no reasoning metadata");
    }
    return issues;
  }

  if (!env.AI_REASONING_ENABLED && reasoning.mandatory) {
    issues.push("reasoning is mandatory for this model but AI_REASONING_ENABLED=false");
  }

  const supportedEfforts = reasoning.supported_efforts;
  if (
    env.AI_REASONING_ENABLED &&
    Array.isArray(supportedEfforts) &&
    !supportedEfforts.includes(env.AI_REASONING_EFFORT)
  ) {
    issues.push(
      `configured reasoning effort '${env.AI_REASONING_EFFORT}' is not in [${supportedEfforts.join(", ")}]`,
    );
  }

  return issues;
}

async function main(): Promise<void> {
  const env = getEnv();
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");

  heading("Verify OpenRouter model IDs and required capabilities");
  const response = await fetch(`${env.OPENROUTER_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`OpenRouter models endpoint returned ${response.status}`);

  const payload = await response.json() as ModelsResponse;
  const available = new Map((payload.data ?? []).map((model) => [model.id, model]));
  let invalid = false;

  for (const id of [env.AI_PRIMARY_MODEL, env.AI_FALLBACK_MODEL]) {
    const model = available.get(id);
    if (!model) {
      console.error(`✗ ${id} is not available to this OpenRouter key/workspace`);
      invalid = true;
      continue;
    }

    console.log(`✓ ${id}`);
    console.log(`  context: ${model.context_length ?? "unknown"}`);
    console.log(`  pricing: ${JSON.stringify(model.pricing ?? {})}`);

    const structuredOutputs = supportsStructuredOutputs(model);
    console.log(`  structured outputs advertised: ${structuredOutputs ? "yes" : "no/unknown"}`);
    if (!structuredOutputs) {
      console.error("  ✗ response_format/structured_outputs is not advertised");
      invalid = true;
    }

    if (model.reasoning) {
      console.log(`  reasoning mandatory: ${model.reasoning.mandatory ?? "unknown"}`);
      console.log(`  reasoning default enabled: ${model.reasoning.default_enabled ?? "unknown"}`);
      console.log(`  reasoning default effort: ${model.reasoning.default_effort ?? "unknown"}`);
      console.log(`  supported efforts: ${JSON.stringify(model.reasoning.supported_efforts ?? null)}`);
    } else {
      console.log("  reasoning metadata: not advertised");
    }

    for (const issue of validateReasoning(model)) {
      console.error(`  ✗ ${issue}`);
      invalid = true;
    }
  }

  console.log(`\nLocal reasoning configuration: ${env.AI_REASONING_ENABLED ? `enabled (${env.AI_REASONING_EFFORT})` : "disabled"}`);
  if (invalid) process.exitCode = 1;
}

main().catch(fail);
