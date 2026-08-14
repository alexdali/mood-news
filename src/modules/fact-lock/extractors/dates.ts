import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { candidatesFromRegex } from "@/modules/fact-lock/extractors/base";
import { MONTHS } from "@/modules/fact-lock/patterns";

const months = MONTHS.join("|");

export const dateExtractor: FactExtractor = {
  name: "date-regex",
  priority: 84,
  extract(text, sourceField) {
    const patterns = [
      /\b\d{4}-\d{2}-\d{2}\b/gu,
      /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/gu,
      new RegExp(`\\b(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "giu"),
      new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months})(?:\\s+\\d{4})?\\b`, "giu"),
    ];
    return patterns.flatMap((regex) => candidatesFromRegex({
      text,
      sourceField,
      regex,
      factType: "date",
      extractor: this.name,
      priority: this.priority,
    }));
  },
};

export const timeExtractor: FactExtractor = {
  name: "time-regex",
  priority: 82,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?(?:am|pm|UTC|GMT))?\b/giu,
      factType: "time",
      extractor: this.name,
      priority: this.priority,
    });
  },
};
