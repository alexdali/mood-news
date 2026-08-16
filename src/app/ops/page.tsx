import { Activity, Database, Gauge, ShieldCheck } from "lucide-react";
import { OpsSummaryService } from "@/modules/ops/summary-service";
import { formatUsd } from "@/modules/ops/cost";
import { StatCard } from "@/components/ops/stat-card";
import { SourceTable } from "@/components/ops/source-table";
import { AiRequestLog } from "@/components/ops/ai-request-log";
import { ValidationFailureLog } from "@/components/ops/validation-failure-log";
import { CostHistory } from "@/components/ops/cost-history";
import { AuditPagination } from "@/components/ops/audit-pagination";
import { IngestionStatus } from "@/components/ops/ingestion-status";
import { getLocale, uiCopy, withLocale } from "@/i18n/ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OperationsPage({ searchParams }: { searchParams: Promise<{ lang?: string; aiPage?: string; validationPage?: string }> }) {
  const params = await searchParams;
  const locale = getLocale(params.lang);
  const aiPage = positivePage(params.aiPage);
  const validationPage = positivePage(params.validationPage);
  const copy = uiCopy[locale].ops;
  const summary = new OpsSummaryService().get({ aiPage, validationPage });
  const ingestion = summary.latestIngestion;
  const aiHref = (page: number) => `${withLocale("/ops", locale, { aiPage: String(page), validationPage: String(validationPage) })}#ai-journal`;
  const validationHref = (page: number) => `${withLocale("/ops", locale, { aiPage: String(aiPage), validationPage: String(page) })}#validation-failures`;
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
        <article className="ops-panel"><h2>{copy.ingestion}</h2><IngestionStatus ingestion={ingestion} schedule={summary.ingestionSchedule} locale={locale} /></article>
        <article className="ops-panel ops-panel--validation" id="validation-failures">
          <h2>{copy.validation}</h2>
          {summary.validation.total > 0 ? <div className="validation-meter"><strong>{(summary.validation.passRate * 100).toFixed(1)}%</strong><span>{summary.validation.passed} / {summary.validation.total} {copy.validationBody}</span></div> : <p className="muted">{copy.noValidation}</p>}
          <details className="validation-history" open={validationPage > 1}>
            <summary>{copy.showValidationFailures} ({summary.validationFailures.total})</summary>
            <ValidationFailureLog rows={summary.validationFailures.rows} locale={locale} />
            <AuditPagination
              locale={locale} page={validationPage} pageSize={summary.validationFailures.pageSize} total={summary.validationFailures.total}
              previousHref={validationHref(validationPage - 1)} nextHref={validationHref(validationPage + 1)}
            />
          </details>
        </article>
      </section>
      <section className="method-panel">
        <header><div><span className="eyebrow">{copy.costEyebrow}</span><h2>{copy.costHistory}</h2></div><strong className="cost-total">{copy.allTime}: {formatUsd(summary.aiAudit.costAllTime)}</strong></header>
        <CostHistory rows={summary.aiAudit.costByDay} locale={locale} />
      </section>
      <section className="method-panel" id="ai-journal">
        <header><div><span className="eyebrow">{copy.aiJournalEyebrow}</span><h2>{copy.aiJournal}</h2></div><span>{summary.aiAudit.total} {copy.requestsTotal}</span></header>
        <p className="muted audit-intro">{copy.aiJournalIntro}</p>
        <AiRequestLog rows={summary.aiAudit.rows} locale={locale} />
        <AuditPagination
          locale={locale} page={aiPage} pageSize={summary.aiAudit.pageSize} total={summary.aiAudit.total}
          previousHref={aiHref(aiPage - 1)} nextHref={aiHref(aiPage + 1)}
        />
      </section>
      <section className="method-panel"><header><div><span className="eyebrow">{copy.provenance}</span><h2>{copy.inventory}</h2></div></header><SourceTable rows={summary.sources} locale={locale} /></section>
    </>
  );
}

function positivePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
