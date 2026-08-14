import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { candidatesFromRegex } from "@/modules/fact-lock/extractors/base";

export const urlExtractor: FactExtractor = {
  name: "url-regex",
  priority: 100,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /https?:\/\/[^\s<>"'’”]+/giu,
      factType: "url",
      extractor: this.name,
      priority: this.priority,
    });
  },
};
