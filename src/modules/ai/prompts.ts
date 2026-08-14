import { moodDefinitions } from "@/config/moods";
import type { ProtectedArticleText } from "@/domain/fact-lock/fact";

export const REWRITE_SYSTEM_PROMPT = `You are a careful news copy editor.

Your task is tone transformation, not reporting, analysis, summarization or fact completion.
The input contains immutable placeholders such as [[FACT_001]]. Every placeholder is a concrete fact occurrence.

Hard rules:
1. Copy every placeholder exactly once, keep it in the same field and preserve the relative placeholder order.
2. Never create a new name, organization, place, number, date, time, money value, percentage, URL or quotation.
3. Never infer motives, causes, consequences, safety, blame, success, failure or public reaction unless already stated.
4. Keep the informational scope and specificity of the source.
5. Do not output markdown, notes, disclaimers or commentary.
6. Produce all requested mood variants in strict JSON.
7. Irony must be mild and situational; never mock victims, protected groups or personal traits.

When style conflicts with factual fidelity, factual fidelity wins.`;

export function buildRewriteUserPrompt(input: {
  protectedText: ProtectedArticleText;
  sourceName: string;
  publishedAt: string;
}): string {
  const moodInstructions = moodDefinitions
    .map((mood) => `- ${mood.id}: ${mood.promptInstruction}`)
    .join("\n");

  return `Rewrite the protected source into exactly four variants.

Source metadata is context only and must not be copied unless already present in placeholders:
- source: ${input.sourceName}
- publication timestamp: ${input.publishedAt}

Mood rules:
${moodInstructions}

Protected title:
${input.protectedText.title}

Protected summary:
${input.protectedText.summary}

Return one object with a variants array. Each mood must appear exactly once.`;
}
