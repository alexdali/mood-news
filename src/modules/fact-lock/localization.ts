import type { LocalizedFactCandidate, ProtectedFact } from "@/domain/fact-lock/fact";
import type { Locale } from "@/i18n/ui";
import { normalizeFactValue } from "@/modules/fact-lock/extractors/base";

export type FactLocalizationResult = {
  passed: boolean;
  facts: ProtectedFact[];
  issues: string[];
};

const exactValueTypes = new Set<ProtectedFact["factType"]>([
  "url",
  "money",
  "percentage",
  "time",
  "number",
]);

function numericTokens(value: string): string[] {
  return value.match(/\d+(?:[.,]\d+)?/g) ?? [];
}

function isLanguageNeutralName(value: string): boolean {
  const compact = value.replace(/[^A-Za-z0-9]/g, "");
  return compact.length > 0 && compact.length <= 12 && (
    compact === compact.toUpperCase()
    || /[A-Z].*[A-Z]/.test(compact.slice(1))
  );
}

function containsEnoughRussian(value: string): boolean {
  const letters = value.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return true;
  const cyrillic = value.match(/[А-ЯЁа-яё]/g) ?? [];
  return cyrillic.length / letters.length >= 0.4;
}

export function validateFactLocalizations(input: {
  facts: ProtectedFact[];
  candidates: LocalizedFactCandidate[];
  locale: Locale;
}): FactLocalizationResult {
  const issues: string[] = [];
  const expected = new Map(input.facts.map((fact) => [fact.placeholder, fact]));
  const expectedOrder = input.facts.map((fact) => fact.placeholder);
  const candidateOrder = input.candidates.map((candidate) => candidate.placeholder);
  if (
    candidateOrder.length === expectedOrder.length
    && candidateOrder.some((placeholder, index) => placeholder !== expectedOrder[index])
  ) {
    issues.push("ORDER_CHANGED");
  }
  const counts = new Map<string, number>();
  for (const candidate of input.candidates) {
    counts.set(candidate.placeholder, (counts.get(candidate.placeholder) ?? 0) + 1);
    if (!expected.has(candidate.placeholder)) issues.push(`UNKNOWN:${candidate.placeholder}`);
  }

  const localized = input.facts.map((fact) => {
    const candidates = input.candidates.filter((candidate) => candidate.placeholder === fact.placeholder);
    if (candidates.length === 0) {
      issues.push(`MISSING:${fact.placeholder}`);
      return fact;
    }
    if (candidates.length > 1) issues.push(`DUPLICATED:${fact.placeholder}`);
    const value = candidates[0]?.value.trim() ?? "";
    if (!value || value.length > Math.max(1_000, fact.value.length * 6)) {
      issues.push(`INVALID_VALUE:${fact.placeholder}`);
      return fact;
    }
    if (/\[\[FACT_\d{3}\]\]/.test(value) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
      issues.push(`UNSAFE_VALUE:${fact.placeholder}`);
    }

    const exactRequired = input.locale === "en" || exactValueTypes.has(fact.factType);
    if (exactRequired && value !== fact.value) issues.push(`CHANGED_EXACT:${fact.placeholder}`);
    if (numericTokens(value).join("|") !== numericTokens(fact.value).join("|")) {
      issues.push(`CHANGED_NUMBERS:${fact.placeholder}`);
    }
    if (
      input.locale === "ru"
      && !exactValueTypes.has(fact.factType)
      && !isLanguageNeutralName(fact.value)
      && !containsEnoughRussian(value)
    ) {
      issues.push(`WRONG_LANGUAGE:${fact.placeholder}`);
    }

    return { ...fact, value, normalizedValue: normalizeFactValue(value) };
  });

  for (const [placeholder, count] of counts) {
    if (count > 1 && expected.has(placeholder) && !issues.includes(`DUPLICATED:${placeholder}`)) {
      issues.push(`DUPLICATED:${placeholder}`);
    }
  }

  return { passed: issues.length === 0, facts: localized, issues };
}
