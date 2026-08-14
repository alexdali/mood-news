import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";

export class EventRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  record(eventType: string, input: { entityType?: string; entityId?: string; payload?: unknown } = {}): void {
    this.db.prepare(`
      INSERT INTO app_events(id, event_type, entity_type, entity_id, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      createId("event"),
      eventType,
      input.entityType ?? null,
      input.entityId ?? null,
      JSON.stringify(input.payload ?? {}),
      nowIso(),
    );
  }
}
