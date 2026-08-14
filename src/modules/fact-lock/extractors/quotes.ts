import type { FactExtractor } from "@/modules/fact-lock/extractors/base";
import { candidatesFromRegex } from "@/modules/fact-lock/extractors/base";

export const quoteExtractor: FactExtractor = {
  name: "quote-regex",
  priority: 95,
  extract(text, sourceField) {
    return candidatesFromRegex({
      text,
      sourceField,
      regex: /«[^»\n]{2,}»|“[^”\n]{2,}”|"[^"\n]{2,}"/gu,
      factType: "quote",
      extractor: this.name,
      priority: this.priority,
    });
  },
};
