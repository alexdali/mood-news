import { beforeEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "@/config/env";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { validateProtectedVariant } from "@/modules/fact-lock/validator";
import { sourceSummary, sourceTitle } from "@/test/fixtures/articles";

beforeEach(() => resetEnvForTests());

describe("Fact Lock validator", () => {
  const original = { title: sourceTitle, summary: sourceSummary };

  it("accepts a field-preserving rewrite", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const result = validateProtectedVariant({ protectedText, original, output: {
      title: `Encouragingly, ${protectedText.title}`,
      summary: `Looking ahead, ${protectedText.summary}`,
    }});
    expect(result.passed).toBe(true);
    expect(result.preservedCount).toBe(result.expectedCount);
  });

  it("rejects a missing placeholder", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const first = protectedText.facts[0]?.placeholder;
    expect(first).toBeTruthy();
    const result = validateProtectedVariant({
      protectedText,
      original,
      output: { title: protectedText.title.replace(first!, ""), summary: protectedText.summary },
    });
    expect(result.passed).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("MISSING_FACTS");
  });

  it("rejects a placeholder moved from title to summary", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const titleFact = protectedText.facts.find((fact) => fact.sourceField === "title");
    expect(titleFact).toBeTruthy();
    const result = validateProtectedVariant({
      protectedText,
      original,
      output: {
        title: protectedText.title.replace(titleFact!.placeholder, ""),
        summary: `${protectedText.summary} ${titleFact!.placeholder}`,
      },
    });
    expect(result.issues.map((issue) => issue.code)).toContain("PLACEHOLDER_MOVED_FIELD");
  });

  it("rejects reordering protected facts inside the same field", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const summaryPlaceholders = protectedText.facts
      .filter((fact) => fact.sourceField === "summary")
      .map((fact) => fact.placeholder);
    expect(summaryPlaceholders.length).toBeGreaterThan(1);
    const reversed = [...summaryPlaceholders].reverse();
    let changedSummary = protectedText.summary;
    summaryPlaceholders.forEach((placeholder, index) => {
      changedSummary = changedSummary.replace(placeholder, `[[TMP_${index}]]`);
    });
    reversed.forEach((placeholder, index) => {
      changedSummary = changedSummary.replace(`[[TMP_${index}]]`, placeholder);
    });
    const result = validateProtectedVariant({
      protectedText,
      original,
      output: { title: protectedText.title, summary: changedSummary },
    });
    expect(result.passed).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("PLACEHOLDER_ORDER_CHANGED");
  });

  it("rejects newly invented concrete numbers", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const result = validateProtectedVariant({
      protectedText,
      original,
      output: { title: protectedText.title, summary: `${protectedText.summary} The chance of success is 99%.` },
    });
    expect(result.passed).toBe(false);
    expect(result.addedFacts.some((fact) => fact.includes("99%"))).toBe(true);
  });

  it("rejects a newly invented named entity", () => {
    const protectedText = protectArticleText("article_test", original.title, original.summary);
    const result = validateProtectedVariant({
      protectedText,
      original,
      output: {
        title: protectedText.title,
        summary: `${protectedText.summary} Donald Trump praised the decision.`,
      },
    });
    expect(result.passed).toBe(false);
    expect(result.addedFacts.some((fact) => fact.toLowerCase().includes("donald trump"))).toBe(true);
  });
});
