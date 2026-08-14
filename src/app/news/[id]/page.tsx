import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Database, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getEnv } from "@/config/env";
import { isMood } from "@/domain/news/mood";
import { NotFoundError } from "@/core/errors";
import { NewsDetailService } from "@/modules/news/news-detail-service";
import { ArticleComparison } from "@/components/article-comparison";
import { ProtectedFactsList } from "@/components/protected-facts-list";
import { MoodSwitcher } from "@/components/mood-switcher";
import { SourceBadge } from "@/components/source-badge";
import { RewriteButton } from "@/components/rewrite-button";
import { getLocale, uiCopy } from "@/i18n/ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const view = new NewsDetailService().get(id, getEnv().DEFAULT_MOOD, "en");
    return { title: view.article.title };
  } catch {
    return { title: "News comparison" };
  }
}

export default async function NewsDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mood?: string; lang?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const mood = isMood(query.mood) ? query.mood : getEnv().DEFAULT_MOOD;
  const locale = getLocale(query.lang);
  const copy = uiCopy[locale];
  let view: ReturnType<NewsDetailService["get"]>;
  try {
    view = new NewsDetailService().get(id, mood, locale);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <div className="detail-toolbar">
        <Link href={`/?mood=${mood}&lang=${locale}`} className="back-link"><ArrowLeft size={16} /> {copy.detail.back}</Link>
        <MoodSwitcher selected={mood} locale={locale} />
      </div>
      <section className="article-heading">
        <div className="article-heading__meta">
          <SourceBadge name={view.article.sourceName} url={view.article.canonicalUrl} />
          <span><Clock3 size={14} /> {copy.detail.published} {view.article.publishedAt}</span>
          <span><Database size={14} /> {copy.detail.fetched} {view.article.fetchedAt}</span>
        </div>
        <h1>{copy.detail.title}</h1>
        <p>{copy.detail.intro}</p>
      </section>
      <ArticleComparison view={view} locale={locale} />
      {!view.rewrite ? <section className="callout"><div><h2>{copy.detail.noRewrite}</h2><p>{copy.detail.noRewriteBody}</p></div><RewriteButton articleId={view.article.id} locale={locale} /></section> : null}
      <section className="method-panel">
        <header><div><span className="eyebrow"><ShieldCheck size={14} /> {copy.detail.audit}</span><h2>{view.rewrite ? copy.detail.madeImmutable : copy.detail.willBeImmutable}</h2></div><span>{view.facts.length} {copy.detail.protectedOccurrences}</span></header>
        <ProtectedFactsList facts={view.facts} locale={locale} />
      </section>
    </>
  );
}
