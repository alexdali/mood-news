import { getEnv } from "@/config/env";
import { moods } from "@/domain/news/mood";
import type { NewsArticle } from "@/domain/news/article";
import { BudgetExceededError } from "@/core/errors";
import { FactRepository } from "@/db/repositories/fact-repository";
import { RewriteRepository } from "@/db/repositories/rewrite-repository";
import { AiRunRepository } from "@/db/repositories/ai-run-repository";
import { EventRepository } from "@/db/repositories/event-repository";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { restoreArticleFields } from "@/modules/fact-lock/restore";
import { REWRITE_SYSTEM_PROMPT, buildRewriteUserPrompt } from "@/modules/ai/prompts";
import { ModelRouter } from "@/modules/ai/model-router";
import type { Locale } from "@/i18n/ui";

export class RewriteService {
  constructor(
    private readonly modelRouter = new ModelRouter(),
    private readonly facts = new FactRepository(),
    private readonly rewrites = new RewriteRepository(),
    private readonly aiRuns = new AiRunRepository(),
    private readonly events = new EventRepository(),
  ) {}

  async rewriteArticle(article: NewsArticle, locale: Locale): Promise<{ model: string; moods: number; locale: Locale }> {
    const env = getEnv();
    const existing = this.rewrites.listForArticle(article.id, locale, env.AI_PROMPT_VERSION);
    if (existing.length === moods.length) {
      return { model: existing[0]?.model ?? "cached", moods: existing.length, locale };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const spent = this.aiRuns.costSince(today.toISOString());
    if (env.MAX_DAILY_AI_COST_USD > 0 && spent >= env.MAX_DAILY_AI_COST_USD) {
      this.aiRuns.record({
        articleId: article.id,
        model: env.AI_PRIMARY_MODEL,
        modelRole: "primary",
        status: "budget_blocked",
        locale,
        latencyMs: 0,
        errorCode: "AI_BUDGET_EXCEEDED",
        errorMessage: `Spent $${spent.toFixed(4)} of $${env.MAX_DAILY_AI_COST_USD.toFixed(2)}`,
      });
      throw new BudgetExceededError(env.MAX_DAILY_AI_COST_USD, spent);
    }

    const extractedText = protectArticleText(article.id, article.title, article.summary);
    const persistedFacts = this.facts.replaceForArticle(article.id, extractedText.facts);
    const protectedText = { ...extractedText, facts: persistedFacts };

    const result = await this.modelRouter.generate({
      articleId: article.id,
      protectedText,
      targetLocale: locale,
      systemPrompt: REWRITE_SYSTEM_PROMPT,
      userPrompt: buildRewriteUserPrompt({
        protectedText,
        sourceName: article.sourceName,
        publishedAt: article.publishedAt,
        targetLocale: locale,
      }),
    });

    const restoredVariants = result.payload.variants.map((variant) => ({
      mood: variant.mood,
      ...restoreArticleFields({ title: variant.title, summary: variant.summary, facts: result.localizedFacts }),
    }));
    this.facts.saveLocalizations(article.id, locale, result.localizedFacts, result.model);
    this.rewrites.saveValidatedBatch({
      articleId: article.id,
      model: result.model,
      locale,
      promptVersion: env.AI_PROMPT_VERSION,
      variants: restoredVariants,
      validations: result.validations,
    });
    this.events.record("rewrite.validated", {
      entityType: "news_article",
      entityId: article.id,
      payload: { model: result.model, promptVersion: env.AI_PROMPT_VERSION, locale, moods: moods.length },
    });
    return { model: result.model, moods: moods.length, locale };
  }
}
