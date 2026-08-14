import { Activity, Database, Gauge, ShieldCheck } from "lucide-react";
import { OpsSummaryService } from "@/modules/ops/summary-service";
import { formatUsd } from "@/modules/ops/cost";
import { StatCard } from "@/components/ops/stat-card";
import { SourceTable } from "@/components/ops/source-table";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function OperationsPage() {
  const summary = new OpsSummaryService().get();
  const ingestion = summary.latestIngestion;
  return (
    <>
      <section className="page-heading"><span className="eyebrow">Observable prototype</span><h1>Operations and evidence</h1><p>This screen exposes freshness, AI cost, validation results and the exact configured routing chain.</p></section>
      <section className="stats-grid">
        <StatCard label="Active articles" value={summary.articles} detail="Imported real source records" icon={<Database size={20} />} />
        <StatCard label="Validated rewrites" value={summary.validatedRewrites} detail={`Prompt ${summary.models.promptVersion}`} icon={<ShieldCheck size={20} />} />
        <StatCard label="AI requests / 24h" value={summary.aiLast24Hours.requests} detail={`${summary.aiLast24Hours.failures} failed`} icon={<Activity size={20} />} />
        <StatCard label="AI cost / 24h" value={formatUsd(summary.aiLast24Hours.costUsd)} detail={`${summary.aiLast24Hours.averageLatencyMs} ms average`} icon={<Gauge size={20} />} />
      </section>
      <section className="ops-layout">
        <article className="ops-panel"><h2>Current model route</h2><dl className="key-values"><div><dt>Primary</dt><dd><code>{summary.models.primary}</code></dd></div><div><dt>Fallback</dt><dd><code>{summary.models.fallback}</code></dd></div><div><dt>Fallback trigger</dt><dd>API, parse or Fact Lock failure</dd></div></dl></article>
        <article className="ops-panel"><h2>Latest ingestion</h2>{ingestion ? <dl className="key-values"><div><dt>Status</dt><dd>{ingestion.status}</dd></div><div><dt>Started</dt><dd>{ingestion.startedAt}</dd></div><div><dt>Fetched</dt><dd>{ingestion.fetchedCount}</dd></div><div><dt>New / changed</dt><dd>{ingestion.insertedCount} / {ingestion.updatedCount}</dd></div><div><dt>Errors</dt><dd>{ingestion.errorCount}</dd></div></dl> : <p className="muted">No ingestion run recorded.</p>}</article>
        <article className="ops-panel"><h2>Validation history</h2><div className="validation-meter"><strong>{(summary.validation.passRate * 100).toFixed(1)}%</strong><span>{summary.validation.passed} of {summary.validation.total} model outputs that reached Fact Lock passed.</span></div></article>
      </section>
      <section className="method-panel"><header><div><span className="eyebrow">Data provenance</span><h2>Source inventory</h2></div></header><SourceTable rows={summary.sources} /></section>
    </>
  );
}
