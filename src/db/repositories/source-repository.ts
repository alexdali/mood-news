import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { nowIso } from "@/core/time";
import type { NewsSource } from "@/domain/news/source";
import { parseJson } from "@/core/json";
import type { SourceRow } from "@/db/schema";

export type SourceUpsertInput = {
  id: string;
  kind: "rss" | "guardian";
  name: string;
  baseUrl: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

export class SourceRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  upsert(input: SourceUpsertInput): void {
    const now = nowIso();
    this.db.prepare(`
      INSERT INTO sources(id, kind, name, base_url, enabled, config_json, created_at, updated_at)
      VALUES (@id, @kind, @name, @baseUrl, @enabled, @configJson, @now, @now)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        name = excluded.name,
        base_url = excluded.base_url,
        enabled = excluded.enabled,
        config_json = excluded.config_json,
        updated_at = excluded.updated_at
    `).run({
      ...input,
      enabled: input.enabled ? 1 : 0,
      configJson: JSON.stringify(input.config ?? {}),
      now,
    });
  }

  list(): NewsSource[] {
    const rows = this.db.prepare("SELECT * FROM sources ORDER BY name").all() as SourceRow[];
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      baseUrl: row.base_url,
      enabled: row.enabled === 1,
      config: parseJson<Record<string, unknown>>(row.config_json, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
