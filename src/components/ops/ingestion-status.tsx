import type { IngestionRunSummary } from "@/domain/ingestion/run";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

type IngestionSchedule = {
  lastRequestedAt: string;
  nextRequestedAt: string;
  intervalMs: number;
};

export function IngestionStatus(input: {
  ingestion: IngestionRunSummary | null;
  schedule: IngestionSchedule | null;
  locale: Locale;
}) {
  const copy = uiCopy[input.locale].ops;
  if (!input.ingestion || !input.schedule) return <p className="muted">{copy.noIngestion}</p>;
  return (
    <dl className="key-values">
      <div><dt>{copy.status}</dt><dd>{copy.statuses[input.ingestion.status]}</dd></div>
      <div><dt>{copy.lastNewsRequest}</dt><dd>{formatUtc(input.schedule.lastRequestedAt, input.locale)}</dd></div>
      <div><dt>{copy.nextNewsRequest}</dt><dd>{formatUtc(input.schedule.nextRequestedAt, input.locale)}</dd></div>
      <div><dt>{copy.interval}</dt><dd>{formatInterval(input.schedule.intervalMs, input.locale)}</dd></div>
      <div><dt>{copy.fetched}</dt><dd>{input.ingestion.fetchedCount}</dd></div>
      <div><dt>{copy.changed}</dt><dd>{input.ingestion.insertedCount} / {input.ingestion.updatedCount}</dd></div>
      <div><dt>{copy.errors}</dt><dd>{input.ingestion.errorCount}</dd></div>
    </dl>
  );
}

function formatUtc(value: string, locale: Locale): string {
  return `${new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

function formatInterval(intervalMs: number, locale: Locale): string {
  const minutes = intervalMs / 60_000;
  return locale === "ru" ? `${minutes} мин` : `${minutes} min`;
}
