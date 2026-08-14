import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { candidatesFromRegex } from "@/modules/fact-lock/extractors/base";

export const moneyExtractor: FactExtractor = {
  name: "money-regex",
  priority: 92,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /(?:[$€£₸]\s?\d[\d,.]*(?:\s?(?:million|billion|trillion|m|bn))?|\b\d[\d,.]*(?:\s?(?:million|billion|trillion|m|bn))?\s?(?:USD|EUR|GBP|KZT|dollars?|euros?|pounds?|tenge)\b)/giu,
      factType: "money",
      extractor: this.name,
      priority: this.priority,
    });
  },
};

export const percentageExtractor: FactExtractor = {
  name: "percentage-regex",
  priority: 88,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /\b\d+(?:[.,]\d+)?\s?(?:%(?![\p{L}\p{N}])|percent\b|per cent\b)/giu,
      factType: "percentage",
      extractor: this.name,
      priority: this.priority,
    });
  },
};

export const numberExtractor: FactExtractor = {
  name: "number-regex",
  priority: 70,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /(?<![\p{L}\p{N}])[-+]?\d[\d,.]*(?:st|nd|rd|th)?(?![\p{L}\p{N}])/giu,
      factType: "number",
      extractor: this.name,
      priority: this.priority,
    });
  },
};
