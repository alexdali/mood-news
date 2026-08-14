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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const view = new NewsDetailService().get(id, getEnv().DEFAULT_MOOD);
    return { title: view.article.title };
  } catch {
    return { title: "News comparison" };
  }
}

export default async function NewsDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mood?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const mood = isMood(query.mood) ? query.mood : getEnv().DEFAULT_MOOD;
  let view: ReturnType<NewsDetailService["get"]>;
  try {
    view = new NewsDetailService().get(id, mood);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <div className="detail-toolbar">
        <Link href={`/?mood=${mood}`} className="back-link"><ArrowLeft size={16} /> Back to grid</Link>
        <MoodSwitcher selected={mood} />
      </div>
      <section className="article-heading">
        <div className="article-heading__meta">
          <SourceBadge name={view.article.sourceName} url={view.article.canonicalUrl} />
          <span><Clock3 size={14} /> Published {view.article.publishedAt}</span>
          <span><Database size={14} /> Fetched {view.article.fetchedAt}</span>
        </div>
        <h1>Source vs emotional rewrite</h1>
        <p>The right-hand text is visible as verified only after exact placeholder checks and a second scan for newly introduced concrete facts.</p>
      </section>
      <ArticleComparison view={view} />
      {!view.rewrite ? <section className="callout"><div><h2>No validated rewrite yet</h2><p>The original remains visible. Generation will create all four moods and reject the batch if any variant changes a protected fact.</p></div><RewriteButton articleId={view.article.id} /></section> : null}
      <section className="method-panel">
        <header><div><span className="eyebrow"><ShieldCheck size={14} /> Fact Lock audit</span><h2>What was made immutable</h2></div><span>{view.facts.length} protected occurrences</span></header>
        <ProtectedFactsList facts={view.facts} />
      </section>
    </>
  );
}
