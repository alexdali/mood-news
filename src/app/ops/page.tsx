import { Activity, Database, Gauge, ShieldCheck } from "lucide-react";
import { OpsSummaryService } from "@/modules/ops/summary-service";
import { formatUsd } from "@/modules/ops/cost";
import { StatCard } from "@/components/ops/stat-card";
import { SourceTable } from "@/components/ops/source-table";
import { getLocale, uiCopy } from "@/i18n/ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = getLocale((await searchParams).lang);
  const copy = uiCopy[locale].ops;
  const summary = new OpsSummaryService().get();
  const ingestion = summary.latestIngestion;
  return (
    <>
      <section className="page-heading"><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></section>
      <section className="stats-grid">
        <StatCard label={copy.activeArticles} value={summary.articles} detail={copy.activeDetail} icon={<Database size={20} />} />
        <StatCard label={copy.rewrites} value={summary.validatedRewrites} detail={`${copy.prompt} ${summary.models.promptVersion}`} icon={<ShieldCheck size={20} />} />
        <StatCard label={copy.requests} value={summary.aiLast24Hours.requests} detail={`${summary.aiLast24Hours.failures} ${copy.failed}`} icon={<Activity size={20} />} />
        <StatCard label={copy.cost} value={formatUsd(summary.aiLast24Hours.costUsd)} detail={`${summary.aiLast24Hours.averageLatencyMs} ${copy.average}`} icon={<Gauge size={20} />} />
      </section>
      <section className="ops-layout">
        <article className="ops-panel"><h2>{copy.route}</h2><dl className="key-values"><div><dt>{copy.primary}</dt><dd><code>{summary.models.primary}</code></dd></div><div><dt>{copy.fallback}</dt><dd><code>{summary.models.fallback}</code></dd></div><div><dt>{copy.trigger}</dt><dd>{copy.triggerValue}</dd></div></dl></article>
        <article className="ops-panel"><h2>{copy.ingestion}</h2>{ingestion ? <dl className="key-values"><div><dt>{copy.status}</dt><dd>{copy.statuses[ingestion.status]}</dd></div><div><dt>{copy.started}</dt><dd>{ingestion.startedAt}</dd></div><div><dt>{copy.fetched}</dt><dd>{ingestion.fetchedCount}</dd></div><div><dt>{copy.changed}</dt><dd>{ingestion.insertedCount} / {ingestion.updatedCount}</dd></div><div><dt>{copy.errors}</dt><dd>{ingestion.errorCount}</dd></div></dl> : <p className="muted">{copy.noIngestion}</p>}</article>
        <article className="ops-panel"><h2>{copy.validation}</h2>{summary.validation.total > 0 ? <div className="validation-meter"><strong>{(summary.validation.passRate * 100).toFixed(1)}%</strong><span>{summary.validation.passed} / {summary.validation.total} {copy.validationBody}</span></div> : <p className="muted">{copy.noValidation}</p>}</article>
      </section>
      <section className="method-panel"><header><div><span className="eyebrow">{copy.provenance}</span><h2>{copy.inventory}</h2></div></header><SourceTable rows={summary.sources} locale={locale} /></section>
    </>
  );
}
