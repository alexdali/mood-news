import Link from "next/link";
import type { AiRunAudit } from "@/domain/ai/run";
import type { Locale } from "@/i18n/ui";
import { uiCopy, withLocale } from "@/i18n/ui";
import { formatUsd } from "@/modules/ops/cost";

function formatTimestamp(value: string, locale: Locale): string {
  return `${new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium", timeStyle: "medium", timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

function metric(value: number | null, fallback: string): string | number {
  return value ?? fallback;
}

export function AiRequestLog({ rows, locale }: { rows: AiRunAudit[]; locale: Locale }) {
  const copy = uiCopy[locale].ops;
  if (rows.length === 0) return <p className="muted">{copy.noAiRequests}</p>;
  return (
    <div className="audit-list">
      {rows.map((row) => (
        <details className="audit-item" key={row.id}>
          <summary>
            <span className={`audit-status audit-status--${row.status}`}>{copy.aiStatuses[row.status]}</span>
            <strong>{row.model}</strong>
            <span>{row.locale.toUpperCase()} · {formatTimestamp(row.createdAt, locale)}</span>
            <strong>{formatUsd(row.usage.costUsd ?? 0)}</strong>
          </summary>
          <div className="audit-item__body">
            <div className="audit-metrics">
              <div><span>{copy.inputTokens}</span><strong>{metric(row.usage.inputTokens, copy.notRecorded)}</strong></div>
              <div><span>{copy.outputTokens}</span><strong>{metric(row.usage.outputTokens, copy.notRecorded)}</strong></div>
              <div><span>{copy.reasoningTokens}</span><strong>{metric(row.usage.reasoningTokens, copy.notRecorded)}</strong></div>
              <div><span>{copy.cachedTokens}</span><strong>{metric(row.usage.cachedInputTokens, copy.notRecorded)}</strong></div>
              <div><span>{copy.cacheWriteTokens}</span><strong>{metric(row.usage.cacheWriteTokens, copy.notRecorded)}</strong></div>
              <div><span>{copy.duration}</span><strong>{row.latencyMs} ms</strong></div>
              <div><span>{copy.costAmount}</span><strong>{row.usage.costUsd === null ? copy.notRecorded : formatUsd(row.usage.costUsd)}</strong></div>
              <div><span>{copy.cacheStatus}</span><strong>{row.cacheStatus ?? copy.notRecorded}</strong></div>
            </div>
            <dl className="audit-meta">
              <div><dt>{copy.article}</dt><dd><Link href={withLocale(`/news/${row.articleId}`, locale)}>{row.articleTitle}</Link></dd></div>
              <div><dt>{copy.modelRole}</dt><dd>{copy.modelRoles[row.modelRole]}</dd></div>
              <div><dt>{copy.promptVersion}</dt><dd><code>{row.promptVersion}</code></dd></div>
              <div><dt>{copy.providerRequestId}</dt><dd><code>{row.providerRequestId ?? copy.notRecorded}</code></dd></div>
            </dl>
            {row.errorMessage ? <div className="audit-error"><strong>{row.errorCode ?? copy.error}</strong><p>{row.errorMessage}</p></div> : null}
            <PromptBlock title={copy.systemPrompt} value={row.systemPrompt} fallback={copy.promptNotRecorded} />
            <PromptBlock title={copy.userPrompt} value={row.userPrompt} fallback={copy.promptNotRecorded} />
            <PromptBlock title={copy.rawResponse} value={row.responseText} fallback={copy.responseNotRecorded} />
          </div>
        </details>
      ))}
    </div>
  );
}

function PromptBlock({ title, value, fallback }: { title: string; value: string | null; fallback: string }) {
  return (
    <details className="audit-payload">
      <summary>{title}</summary>
      {value ? <pre>{value}</pre> : <p className="muted">{fallback}</p>}
    </details>
  );
}
