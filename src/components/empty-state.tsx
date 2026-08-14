import { Inbox } from "lucide-react";

export function EmptyState() {
  return (
    <section className="empty-state">
      <Inbox size={38} />
      <h2>No imported news yet</h2>
      <p>Run <code>npm run bootstrap</code> or <code>npm run ingest</code>. Product data is fetched from real sources; test fixtures are never loaded into this screen.</p>
    </section>
  );
}
