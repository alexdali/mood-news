import type { FactCandidate, FactSourceField } from "@/domain/fact-lock/fact";
import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { urlExtractor } from "@/modules/fact-lock/extractors/urls";
import { quoteExtractor } from "@/modules/fact-lock/extractors/quotes";
import { moneyExtractor, numberExtractor, percentageExtractor } from "@/modules/fact-lock/extractors/numbers";
import { dateExtractor, timeExtractor } from "@/modules/fact-lock/extractors/dates";
import { entityExtractor } from "@/modules/fact-lock/extractors/entities";

export const allFactExtractors: readonly FactExtractor[] = [
  urlExtractor,
  quoteExtractor,
  moneyExtractor,
  percentageExtractor,
  dateExtractor,
  timeExtractor,
  numberExtractor,
  entityExtractor,
];

export const strictConcreteExtractors: readonly FactExtractor[] = [
  urlExtractor,
  quoteExtractor,
  moneyExtractor,
  percentageExtractor,
  dateExtractor,
  timeExtractor,
  numberExtractor,
];

function overlaps(a: FactCandidate, b: FactCandidate): boolean {
  return a.startIndex < b.endIndex && b.startIndex < a.endIndex;
}

export function resolveOverlaps(candidates: FactCandidate[]): FactCandidate[] {
  const ranked = [...candidates].sort((a, b) =>
    b.priority - a.priority
    || (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex)
    || a.startIndex - b.startIndex,
  );
  const accepted: FactCandidate[] = [];
  for (const candidate of ranked) {
    if (accepted.some((item) => overlaps(item, candidate))) continue;
    accepted.push(candidate);
  }
  return accepted.sort((a, b) => a.startIndex - b.startIndex);
}

export function extractFactsFromField(
  text: string,
  sourceField: FactSourceField,
  extractors: readonly FactExtractor[] = allFactExtractors,
): FactCandidate[] {
  return resolveOverlaps(extractors.flatMap((extractor) => extractor.extract(text, sourceField)));
}
