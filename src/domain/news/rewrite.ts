import type { Mood } from "@/domain/news/mood";

export type NewsRewrite = {
  id: string;
  articleId: string;
  mood: Mood;
  title: string;
  summary: string;
  model: string;
  promptVersion: string;
  status: "validated" | "rejected" | "stale";
  createdAt: string;
  updatedAt: string;
};

export type RewriteVariantInput = Pick<NewsRewrite, "mood" | "title" | "summary">;
