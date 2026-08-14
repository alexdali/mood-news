import type { Mood } from "@/domain/news/mood";
import type { Locale } from "@/i18n/ui";

export type NewsRewrite = {
  id: string;
  articleId: string;
  mood: Mood;
  locale: Locale;
  title: string;
  summary: string;
  model: string;
  promptVersion: string;
  status: "validated" | "rejected" | "stale";
  createdAt: string;
  updatedAt: string;
};

export type RewriteVariantInput = Pick<NewsRewrite, "mood" | "title" | "summary">;
