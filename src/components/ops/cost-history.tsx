import type { AiDailyCost } from "@/domain/ai/run";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";
import { formatUsd } from "@/modules/ops/cost";

export function CostHistory({ rows, locale }: { rows: AiDailyCost[]; locale: Locale }) {
  const copy = uiCopy[locale].ops;
  if (rows.length === 0) return <p className="muted">{copy.noAiRequests}</p>;
  return (
    <div className="audit-table" role="table" aria-label={copy.costHistory}>
      <div className="audit-table__row audit-table__head" role="row">
        <span>{copy.dayUtc}</span><span>{copy.requestsShort}</span><span>{copy.inputTokens}</span>
        <span>{copy.outputTokens}</span><span>{copy.cachedTokens}</span><span>{copy.cost}</span>
      </div>
      {rows.map((row) => (
        <div className="audit-table__row" role="row" key={row.day}>
          <strong>{row.day}</strong><span>{row.requests}</span><span>{row.inputTokens}</span>
          <span>{row.outputTokens}</span><span>{row.cachedInputTokens}</span><strong>{formatUsd(row.costUsd)}</strong>
        </div>
      ))}
    </div>
  );
}
