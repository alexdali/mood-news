export function SourceTable({ rows }: { rows: Array<{ sourceId: string; sourceName: string; articleCount: number }> }) {
  return (
    <div className="simple-table">
      <div className="simple-table__row simple-table__head"><span>Source</span><span>ID</span><span>Active articles</span></div>
      {rows.map((row) => <div className="simple-table__row" key={row.sourceId}><strong>{row.sourceName}</strong><code>{row.sourceId}</code><span>{row.articleCount}</span></div>)}
    </div>
  );
}
