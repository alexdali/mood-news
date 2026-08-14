import type { FactSourceField, ProtectedArticleText, ProtectedFact } from "@/domain/fact-lock/fact";
import type { FactValidationResult, ValidationIssue } from "@/domain/fact-lock/validation";
import { PLACEHOLDER_PATTERN } from "@/modules/fact-lock/patterns";
import { extractFactsFromField, strictConcreteExtractors } from "@/modules/fact-lock/extractor";
import { entityExtractor } from "@/modules/fact-lock/extractors/entities";
import { restoreArticleFields } from "@/modules/fact-lock/restore";
import { getEnv } from "@/config/env";

function occurrences(text: string): string[] {
  return text.match(PLACEHOLDER_PATTERN) ?? [];
}

function countValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function expectedForField(facts: ProtectedFact[], field: FactSourceField): string[] {
  return facts.filter((fact) => fact.sourceField === field).map((fact) => fact.placeholder);
}

function addedConcreteFacts(original: { title: string; summary: string }, rewritten: { title: string; summary: string }): string[] {
  const extract = (text: string, field: FactSourceField) => {
    const concrete = extractFactsFromField(text, field, strictConcreteExtractors);
    const namedEntities = extractFactsFromField(text, field, [entityExtractor])
      .filter((fact) => ["person", "organization", "place"].includes(fact.factType));
    return [...concrete, ...namedEntities].map((fact) => `${fact.factType}:${fact.normalizedValue}`);
  };
  const originalCounts = countValues([...extract(original.title, "title"), ...extract(original.summary, "summary")]);
  const rewrittenCounts = countValues([...extract(rewritten.title, "title"), ...extract(rewritten.summary, "summary")]);
  const added: string[] = [];
  for (const [value, count] of rewrittenCounts) {
    const extra = count - (originalCounts.get(value) ?? 0);
    for (let index = 0; index < extra; index += 1) added.push(value);
  }
  return added;
}

export function validateProtectedVariant(input: {
  protectedText: ProtectedArticleText;
  original: { title: string; summary: string };
  output: { title: string; summary: string };
}): FactValidationResult {
  const expected = input.protectedText.facts.map((fact) => fact.placeholder);
  const expectedSet = new Set(expected);
  const titleOccurrences = occurrences(input.output.title);
  const summaryOccurrences = occurrences(input.output.summary);
  const allOccurrences = [...titleOccurrences, ...summaryOccurrences];
  const counts = countValues(allOccurrences);
  const missing = expected.filter((placeholder) => !counts.has(placeholder));
  const duplicates = expected.filter((placeholder) => (counts.get(placeholder) ?? 0) > 1);
  const unknown = [...new Set(allOccurrences.filter((placeholder) => !expectedSet.has(placeholder)))];
  const issues: ValidationIssue[] = [];

  for (const field of ["title", "summary"] as const) {
    const expectedSequence = expectedForField(input.protectedText.facts, field);
    const fieldExpected = new Set(expectedSequence);
    const fieldActual = field === "title" ? titleOccurrences : summaryOccurrences;
    const misplaced = fieldActual.filter((placeholder) => expectedSet.has(placeholder) && !fieldExpected.has(placeholder));
    if (misplaced.length) issues.push({
      code: "PLACEHOLDER_MOVED_FIELD",
      message: `Protected facts moved into the wrong ${field} field`,
      field,
      values: misplaced,
    });

    const actualSequence = fieldActual.filter((placeholder) => fieldExpected.has(placeholder));
    const sequenceIsComplete = actualSequence.length === expectedSequence.length
      && expectedSequence.every((placeholder) => (counts.get(placeholder) ?? 0) === 1);
    if (sequenceIsComplete && actualSequence.some((placeholder, index) => placeholder !== expectedSequence[index])) {
      issues.push({
        code: "PLACEHOLDER_ORDER_CHANGED",
        message: `Protected facts changed order in the ${field} field`,
        field,
        values: actualSequence,
      });
    }
  }

  if (missing.length) issues.push({ code: "MISSING_FACTS", message: "One or more protected facts are missing", values: missing });
  if (duplicates.length) issues.push({ code: "DUPLICATED_FACTS", message: "One or more protected facts were duplicated", values: duplicates });
  if (unknown.length) issues.push({ code: "UNKNOWN_PLACEHOLDERS", message: "Unknown fact placeholders were introduced", values: unknown });

  const restored = restoreArticleFields({ ...input.output, facts: input.protectedText.facts });
  const addedFacts = addedConcreteFacts(input.original, restored);
  if (addedFacts.length) issues.push({
    code: "ADDED_CONCRETE_FACTS",
    message: "The rewrite introduced new concrete facts or high-confidence named entities",
    values: addedFacts,
  });

  const originalLength = input.original.title.length + input.original.summary.length;
  const rewrittenLength = restored.title.length + restored.summary.length;
  const ratio = originalLength === 0 ? 1 : rewrittenLength / originalLength;
  const env = getEnv();
  if (ratio < env.MIN_REWRITE_LENGTH_RATIO || ratio > env.MAX_REWRITE_LENGTH_RATIO) {
    issues.push({
      code: "LENGTH_OUT_OF_RANGE",
      message: `Rewrite length ratio ${ratio.toFixed(2)} is outside the configured range`,
    });
  }

  if (/\bas an ai\b|\bi cannot\b|\bi'm unable\b/iu.test(`${restored.title} ${restored.summary}`)) {
    issues.push({ code: "MODEL_META_TEXT", message: "The model returned meta commentary instead of a rewrite" });
  }

  const preservedCount = expected.filter((placeholder) => counts.get(placeholder) === 1).length;
  const severeIssueCount = missing.length + duplicates.length + unknown.length + addedFacts.length
    + issues.filter((issue) => ["PLACEHOLDER_MOVED_FIELD", "PLACEHOLDER_ORDER_CHANGED", "LENGTH_OUT_OF_RANGE", "MODEL_META_TEXT"].includes(issue.code)).length;
  const score = Math.max(0, Math.round(100 - severeIssueCount * 20));
  return {
    passed: issues.length === 0,
    score,
    expectedCount: expected.length,
    preservedCount,
    missing,
    duplicates,
    unknown,
    addedFacts,
    issues,
  };
}
