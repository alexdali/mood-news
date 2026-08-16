import { getEnv } from "@/config/env";
import type { Mood } from "@/domain/news/mood";
import { NewsRepository } from "@/db/repositories/news-repository";
import { RewriteRepository } from "@/db/repositories/rewrite-repository";
import type { NewsCardView } from "@/modules/news/view-models";
import type { Locale } from "@/i18n/ui";

export class NewsQueryService {
  constructor(
    private readonly news = new NewsRepository(),
    private readonly rewrites = new RewriteRepository(),
  ) {}

  list(input: { mood: Mood; locale: Locale; limit?: number; offset?: number }): NewsCardView[] {
    const env = getEnv();
    const page = { limit: input.limit ?? env.NEWS_PAGE_SIZE, offset: input.offset ?? 0 };
    const articles = input.locale === "ru"
      ? this.news.listWithValidatedRewrite({
        ...page,
        mood: input.mood,
        locale: input.locale,
        promptVersion: env.AI_PROMPT_VERSION,
      })
      : this.news.list(page);
    return articles.map((article) => {
      const result = this.rewrites.find(article.id, input.mood, input.locale, env.AI_PROMPT_VERSION);
      return {
        article,
        selectedMood: input.mood,
        displayTitle: result?.rewrite.title ?? article.title,
        displaySummary: result?.rewrite.summary ?? article.summary,
        rewrite: result?.rewrite ?? null,
        validation: result?.validation ?? null,
      };
    });
  }
}
