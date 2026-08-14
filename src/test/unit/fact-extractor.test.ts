import { describe, expect, it } from "vitest";
import { extractFactsFromField } from "@/modules/fact-lock/extractor";
import { sourceSummary, sourceTitle } from "@/test/fixtures/articles";

function values(text: string) {
  return extractFactsFromField(text, "summary").map((fact) => ({ type: fact.factType, value: fact.value }));
}

describe("fact extraction", () => {
  it("extracts overlapping concrete facts only once", () => {
    const facts = extractFactsFromField(sourceTitle, "title");
    expect(facts.map((fact) => fact.value)).toContain("$12.5 million");
    expect(facts.map((fact) => fact.value)).toContain("August 14, 2026");
    expect(facts.filter((fact) => fact.value.includes("12.5"))).toHaveLength(1);
  });

  it("extracts quotes, people, places, dates and numbers", () => {
    const facts = values(sourceSummary);
    expect(facts.some((fact) => fact.type === "quote" && fact.value.includes("publish the results"))).toBe(true);
    expect(facts.some((fact) => fact.value === "24")).toBe(true);
    expect(facts.some((fact) => fact.value === "Paris")).toBe(true);
    expect(facts.some((fact) => fact.value === "Dr Jane Smith" || fact.value === "Jane Smith")).toBe(true);
  });

  it("recognizes percentages followed by punctuation", () => {
    const facts = extractFactsFromField("Revenue rose 18.4%, while costs fell 3 percent.", "summary");
    expect(facts.map((fact) => fact.value)).toEqual(expect.arrayContaining(["18.4%", "3 percent"]));
  });
});
