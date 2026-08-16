import Link from "next/link";
import type { AiRunAudit } from "@/domain/ai/run";
import type { Locale } from "@/i18n/ui";
import { uiCopy, withLocale } from "@/i18n/ui";

export function ValidationFailureLog({ rows, locale }: { rows: AiRunAudit[]; locale: Locale }) {
  const copy = uiCopy[locale].ops;
  if (rows.length === 0) return <p className="muted">{copy.noValidationFailures}</p>;
  return (
    <div className="validation-failures">
      {rows.map((row) => (
        <details className="validation-failure" key={row.id}>
          <summary>
            <strong>{row.errorCode ?? copy.validationRejected}</strong>
            <span>{row.model} · {row.locale.toUpperCase()} · {row.createdAt}</span>
          </summary>
          <div className="validation-failure__body">
            <Link href={withLocale(`/news/${row.articleId}`, locale)}>{row.articleTitle}</Link>
            {row.errorMessage ? <p className="audit-error-text">{row.errorMessage}</p> : null}
            {row.validationDetails?.stage === "fact_localization" ? (
              <div><strong>{copy.factLocalizationStage}</strong><ul>{row.validationDetails.issues.map((issue) => <li key={issue}><code>{issue}</code></li>)}</ul></div>
            ) : null}
            {row.validationDetails?.stage === "fact_lock" ? row.validationDetails.variants.map((variant) => (
              <article className="failed-variant" key={variant.mood}>
                <header><strong>{copy.mood}: {variant.mood}</strong><span>{variant.preservedCount}/{variant.expectedCount} · {variant.score}%</span></header>
                <ul>
                  {variant.issues.map((issue, index) => (
                    <li key={`${issue.code}-${index}`}>
                      <code>{issue.code}</code> — {issue.message}
                      {issue.field ? ` · ${issue.field}` : ""}
                      {issue.values?.length ? <small>{issue.values.join(", ")}</small> : null}
                    </li>
                  ))}
                </ul>
              </article>
            )) : null}
            {!row.validationDetails ? <p className="muted">{copy.legacyValidationDetails}</p> : null}
            <details className="audit-payload">
              <summary>{copy.rejectedResponse}</summary>
              {row.responseText ? <pre>{row.responseText}</pre> : <p className="muted">{copy.responseNotRecorded}</p>}
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}
