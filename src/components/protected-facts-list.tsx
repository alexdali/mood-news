import type { ProtectedFact } from "@/domain/fact-lock/fact";

export function ProtectedFactsList({ facts }: { facts: ProtectedFact[] }) {
  if (facts.length === 0) return <p className="muted">No deterministic concrete facts were detected in this source fragment.</p>;
  return (
    <div className="facts-table" role="table" aria-label="Protected facts">
      <div className="facts-table__row facts-table__head" role="row">
        <span>Placeholder</span><span>Type</span><span>Exact source value</span><span>Field</span>
      </div>
      {facts.map((fact) => (
        <div className="facts-table__row" role="row" key={fact.id}>
          <code>{fact.placeholder}</code>
          <span>{fact.factType}</span>
          <strong>{fact.value}</strong>
          <span>{fact.sourceField}</span>
        </div>
      ))}
    </div>
  );
}
