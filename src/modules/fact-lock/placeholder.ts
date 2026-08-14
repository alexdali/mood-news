import type { FactCandidate, ProtectedArticleText, ProtectedFact } from "@/domain/fact-lock/fact";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import { extractFactsFromField } from "@/modules/fact-lock/extractor";

function placeholderFor(index: number): string {
  return `[[FACT_${String(index).padStart(3, "0")}]]`;
}

function replaceSpans(text: string, facts: ProtectedFact[]): string {
  return [...facts]
    .sort((a, b) => b.startIndex - a.startIndex)
    .reduce((result, fact) => `${result.slice(0, fact.startIndex)}${fact.placeholder}${result.slice(fact.endIndex)}`, text);
}

function protectCandidates(articleId: string, candidates: FactCandidate[], startAt: number): ProtectedFact[] {
  const createdAt = nowIso();
  return candidates.map((candidate, index) => ({
    id: createId("fact"),
    articleId,
    factType: candidate.factType,
    value: candidate.value,
    normalizedValue: candidate.normalizedValue,
    placeholder: placeholderFor(startAt + index),
    sourceField: candidate.sourceField,
    startIndex: candidate.startIndex,
    endIndex: candidate.endIndex,
    extractor: candidate.extractor,
    createdAt,
  }));
}

export function protectArticleText(articleId: string, title: string, summary: string): ProtectedArticleText {
  const titleCandidates = extractFactsFromField(title, "title");
  const titleFacts = protectCandidates(articleId, titleCandidates, 1);
  const summaryCandidates = extractFactsFromField(summary, "summary");
  const summaryFacts = protectCandidates(articleId, summaryCandidates, titleFacts.length + 1);
  return {
    title: replaceSpans(title, titleFacts),
    summary: replaceSpans(summary, summaryFacts),
    facts: [...titleFacts, ...summaryFacts],
  };
}
