import type { FactCandidate, FactSourceField, FactType } from "@/domain/fact-lock/fact";

export interface FactExtractor {
  readonly name: string;
  readonly priority: number;
  extract(text: string, sourceField: FactSourceField): FactCandidate[];
}

export function normalizeFactValue(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function candidatesFromRegex(input: {
  text: string;
  sourceField: FactSourceField;
  regex: RegExp;
  factType: FactType;
  extractor: string;
  priority: number;
  filter?: (value: string) => boolean;
}): FactCandidate[] {
  const flags = input.regex.flags.includes("g") ? input.regex.flags : `${input.regex.flags}g`;
  const regex = new RegExp(input.regex.source, flags);
  const candidates: FactCandidate[] = [];
  for (const match of input.text.matchAll(regex)) {
    const value = match[0];
    const startIndex = match.index;
    if (startIndex === undefined || !value || input.filter?.(value) === false) continue;
    candidates.push({
      factType: input.factType,
      value,
      normalizedValue: normalizeFactValue(value),
      sourceField: input.sourceField,
      startIndex,
      endIndex: startIndex + value.length,
      extractor: input.extractor,
      priority: input.priority,
    });
  }
  return candidates;
}
