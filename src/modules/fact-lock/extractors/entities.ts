import type { FactCandidate, FactSourceField, FactType } from "@/domain/fact-lock/fact";
import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { normalizeFactValue } from "@/modules/fact-lock/extractors/base";
import { ENTITY_STOP_WORDS, ORGANIZATION_SUFFIXES } from "@/modules/fact-lock/patterns";

const ENTITY_PATTERN = /\b(?:[A-Z][\p{L}'’.-]+|[A-Z]{2,})(?:\s+(?:[A-Z][\p{L}'’.-]+|[A-Z]{2,}|of|the|and|&)){0,4}\b/gu;

const KNOWN_PLACE_WORDS = new Set([
  "Africa", "America", "Asia", "Australia", "Britain", "China", "Europe", "France", "Germany",
  "India", "Japan", "Kazakhstan", "London", "Moscow", "Paris", "Russia", "Ukraine", "Washington",
]);

function classify(value: string): FactType {
  const words = value.split(/\s+/);
  if (words.some((word) => ORGANIZATION_SUFFIXES.has(word)) || /^[A-Z]{2,}$/.test(value)) return "organization";
  if (words.some((word) => KNOWN_PLACE_WORDS.has(word))) return "place";
  if (words.length === 2 && words.every((word) => /^[A-Z][\p{L}'’.-]+$/u.test(word))) return "person";
  return "entity";
}

export const entityExtractor: FactExtractor = {
  name: "capitalized-entity-heuristic",
  priority: 50,
  extract(text: string, sourceField: FactSourceField): FactCandidate[] {
    const candidates: FactCandidate[] = [];
    for (const match of text.matchAll(ENTITY_PATTERN)) {
      const value = match[0].trim();
      const startIndex = match.index;
      if (startIndex === undefined || !value) continue;
      const firstWord = value.split(/\s+/)[0] ?? value;
      const sentenceStart = startIndex === 0 || /[.!?]\s*$/.test(text.slice(0, startIndex));
      if (sentenceStart && value.split(/\s+/).length === 1 && ENTITY_STOP_WORDS.has(firstWord)) continue;
      if (value.length < 2 || ENTITY_STOP_WORDS.has(value)) continue;
      candidates.push({
        factType: classify(value),
        value,
        normalizedValue: normalizeFactValue(value),
        sourceField,
        startIndex,
        endIndex: startIndex + value.length,
        extractor: this.name,
        priority: this.priority,
      });
    }
    return candidates;
  },
};
