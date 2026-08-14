import type { ProtectedFact } from "@/domain/fact-lock/fact";

export function restoreFacts(text: string, facts: ProtectedFact[]): string {
  const values = new Map(facts.map((fact) => [fact.placeholder, fact.value]));
  return text.replace(/\[\[FACT_\d{3}\]\]/g, (placeholder) => values.get(placeholder) ?? placeholder);
}

export function restoreArticleFields(input: { title: string; summary: string; facts: ProtectedFact[] }): { title: string; summary: string } {
  return {
    title: restoreFacts(input.title, input.facts),
    summary: restoreFacts(input.summary, input.facts),
  };
}
