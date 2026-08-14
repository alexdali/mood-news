import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function SourceTable({ rows, locale }: { rows: Array<{ sourceId: string; sourceName: string; articleCount: number }>; locale: Locale }) {
  const copy = uiCopy[locale].ops;
  return (
    <div className="simple-table">
      <div className="simple-table__row simple-table__head"><span>{copy.source}</span><span>ID</span><span>{copy.active}</span></div>
      {rows.map((row) => <div className="simple-table__row" key={row.sourceId}><strong>{row.sourceName}</strong><code>{row.sourceId}</code><span>{row.articleCount}</span></div>)}
    </div>
  );
}
