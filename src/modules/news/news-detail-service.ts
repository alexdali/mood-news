import { getEnv } from "@/config/env";
import { NotFoundError } from "@/core/errors";
import type { Mood } from "@/domain/news/mood";
import { NewsRepository } from "@/db/repositories/news-repository";
import { RewriteRepository } from "@/db/repositories/rewrite-repository";
import { FactRepository } from "@/db/repositories/fact-repository";
import type { NewsDetailView } from "@/modules/news/view-models";

export class NewsDetailService {
  constructor(
    private readonly news = new NewsRepository(),
    private readonly rewrites = new RewriteRepository(),
    private readonly facts = new FactRepository(),
  ) {}

  get(articleId: string, mood: Mood): NewsDetailView {
    const env = getEnv();
    const article = this.news.findById(articleId);
    if (!article) throw new NotFoundError("News article", articleId);
    const selected = this.rewrites.find(articleId, mood, env.AI_PROMPT_VERSION);
    const available = this.rewrites.listForArticle(articleId, env.AI_PROMPT_VERSION).map((rewrite) => rewrite.mood);
    return {
      article,
      selectedMood: mood,
      displayTitle: selected?.rewrite.title ?? article.title,
      displaySummary: selected?.rewrite.summary ?? article.summary,
      rewrite: selected?.rewrite ?? null,
      validation: selected?.validation ?? null,
      facts: this.facts.listForArticle(articleId),
      availableMoods: available,
    };
  }
}
