import type { LocalizedProtectedFact } from "@/domain/fact-lock/fact";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function ProtectedFactsList({ facts, locale }: { facts: LocalizedProtectedFact[]; locale: Locale }) {
  const copy = uiCopy[locale].facts;
  if (facts.length === 0) return <p className="muted">{copy.empty}</p>;
  return (
    <div className="facts-table" role="table" aria-label={copy.table}>
      <div className="facts-table__row facts-table__head" role="row">
        <span>{copy.placeholder}</span><span>{copy.type}</span><span>{copy.value}</span><span>{copy.field}</span>
      </div>
      {facts.map((fact) => (
        <div className="facts-table__row" role="row" key={fact.id}>
          <code>{fact.placeholder}</code>
          <span>{copy.types[fact.factType]}</span>
          <span className="fact-value">
            <strong>{fact.value}</strong>
            {fact.value !== fact.sourceValue ? <small>{copy.sourceValue}: {fact.sourceValue}</small> : null}
          </span>
          <span>{copy.fields[fact.sourceField]}</span>
        </div>
      ))}
    </div>
  );
}
