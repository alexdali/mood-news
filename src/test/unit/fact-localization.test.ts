import { describe, expect, it } from "vitest";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { validateFactLocalizations } from "@/modules/fact-lock/localization";

describe("localized fact ledger", () => {
  const protectedText = protectArticleText(
    "article_localized",
    "Russia reports 24 flights",
    "Moscow published the result on Monday.",
  );

  it("accepts Russian fact values while preserving numeric facts", () => {
    const translations = new Map([
      ["Russia", "Россия"],
      ["Moscow", "Москва"],
      ["Monday.", "понедельник."],
    ]);
    const result = validateFactLocalizations({
      facts: protectedText.facts,
      locale: "ru",
      candidates: protectedText.facts.map((fact) => ({
        placeholder: fact.placeholder,
        value: translations.get(fact.value) ?? fact.value,
      })),
    });

    expect(result.passed).toBe(true);
    expect(result.facts.map((fact) => fact.value)).toEqual(expect.arrayContaining(["Россия", "Москва", "24"]));
  });

  it("rejects missing, duplicate and changed numeric facts", () => {
    const numberFact = protectedText.facts.find((fact) => fact.value === "24");
    expect(numberFact).toBeDefined();
    const candidates = protectedText.facts
      .filter((fact) => fact.placeholder !== numberFact?.placeholder)
      .map((fact) => ({ placeholder: fact.placeholder, value: fact.value }));
    candidates.push({ placeholder: numberFact!.placeholder, value: "25" });
    candidates.push({ placeholder: numberFact!.placeholder, value: "25" });

    const result = validateFactLocalizations({ facts: protectedText.facts, locale: "ru", candidates });
    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      `DUPLICATED:${numberFact!.placeholder}`,
      `CHANGED_EXACT:${numberFact!.placeholder}`,
      `CHANGED_NUMBERS:${numberFact!.placeholder}`,
    ]));
  });

  it("requires English ledger values to match the source exactly", () => {
    const result = validateFactLocalizations({
      facts: protectedText.facts,
      locale: "en",
      candidates: protectedText.facts.map((fact) => ({
        placeholder: fact.placeholder,
        value: fact.value === "Russia" ? "Russian Federation" : fact.value,
      })),
    });
    expect(result.passed).toBe(false);
    expect(result.issues).toContain(`CHANGED_EXACT:${protectedText.facts.find((fact) => fact.value === "Russia")?.placeholder}`);
  });

  it("rejects a fact ledger whose placeholders are reordered", () => {
    const result = validateFactLocalizations({
      facts: protectedText.facts,
      locale: "en",
      candidates: protectedText.facts.toReversed().map((fact) => ({
        placeholder: fact.placeholder,
        value: fact.value,
      })),
    });

    expect(result.passed).toBe(false);
    expect(result.issues).toContain("ORDER_CHANGED");
  });
});
