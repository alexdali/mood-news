import type { Mood } from "@/domain/news/mood";
import type { NewsArticle } from "@/domain/news/article";
import type { NewsRewrite } from "@/domain/news/rewrite";
import type { ProtectedFact } from "@/domain/fact-lock/fact";
import type { FactValidationResult } from "@/domain/fact-lock/validation";

export type NewsCardView = {
  article: NewsArticle;
  selectedMood: Mood;
  displayTitle: string;
  displaySummary: string;
  rewrite: NewsRewrite | null;
  validation: FactValidationResult | null;
};

export type NewsDetailView = NewsCardView & {
  facts: ProtectedFact[];
  availableMoods: Mood[];
};
