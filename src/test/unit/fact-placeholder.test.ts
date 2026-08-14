import { describe, expect, it } from "vitest";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { restoreArticleFields } from "@/modules/fact-lock/restore";
import { sourceSummary, sourceTitle } from "@/test/fixtures/articles";

describe("Fact Lock placeholders", () => {
  it("round-trips source text exactly", () => {
    const protectedText = protectArticleText("article_test", sourceTitle, sourceSummary);
    expect(protectedText.facts.length).toBeGreaterThan(4);
    expect(protectedText.title).toMatch(/\[\[FACT_\d{3}\]\]/);
    const restored = restoreArticleFields({
      title: protectedText.title,
      summary: protectedText.summary,
      facts: protectedText.facts,
    });
    expect(restored).toEqual({ title: sourceTitle, summary: sourceSummary });
  });

  it("allocates unique placeholders across both fields", () => {
    const protectedText = protectArticleText("article_test", sourceTitle, sourceSummary);
    const placeholders = protectedText.facts.map((fact) => fact.placeholder);
    expect(new Set(placeholders).size).toBe(placeholders.length);
  });
});
