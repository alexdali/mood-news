import { Inbox } from "lucide-react";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function EmptyState({ locale }: { locale: Locale }) {
  const copy = uiCopy[locale].states;
  return (
    <section className="empty-state">
      <Inbox size={38} />
      <h2>{copy.emptyTitle}</h2>
      <p>{copy.emptyBodyStart} <code>npm run bootstrap</code> / <code>npm run ingest</code>. {copy.emptyBodyEnd}</p>
    </section>
  );
}
