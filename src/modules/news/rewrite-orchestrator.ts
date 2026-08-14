import { NotFoundError } from "@/core/errors";
import { NewsRepository } from "@/db/repositories/news-repository";
import { RewriteService } from "@/modules/ai/rewrite-service";

export class RewriteOrchestrator {
  constructor(
    private readonly news = new NewsRepository(),
    private readonly rewriteService = new RewriteService(),
  ) {}

  async rewriteById(articleId: string): Promise<{ model: string; moods: number }> {
    const article = this.news.findById(articleId);
    if (!article) throw new NotFoundError("News article", articleId);
    return this.rewriteService.rewriteArticle(article);
  }
}
