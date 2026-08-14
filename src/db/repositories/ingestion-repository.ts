import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { createId } from "@/core/ids";
import { nowIso } from "@/core/time";
import type { IngestionRunStatus, IngestionRunSummary } from "@/domain/ingestion/run";
import { parseJson } from "@/core/json";

export type IngestionCounters = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
};

export class IngestionRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  startRun(triggerType: string): string {
    const id = createId("ingest");
    this.db.prepare(`
      INSERT INTO ingestion_runs(id, trigger_type, status, started_at)
      VALUES (?, ?, 'running', ?)
    `).run(id, triggerType, nowIso());
    return id;
  }

  finishRun(id: string, status: IngestionRunStatus, counters: IngestionCounters, errors: unknown[]): void {
    this.db.prepare(`
      UPDATE ingestion_runs SET
        status = @status,
        finished_at = @finishedAt,
        fetched_count = @fetchedCount,
        inserted_count = @insertedCount,
        updated_count = @updatedCount,
        skipped_count = @skippedCount,
        error_count = @errorCount,
        errors_json = @errorsJson
      WHERE id = @id
    `).run({ id, status, finishedAt: nowIso(), ...counters, errorsJson: JSON.stringify(errors) });
  }

  startSourceRun(runId: string, sourceId: string): string {
    const id = createId("source_run");
    this.db.prepare(`
      INSERT INTO ingestion_source_runs(id, ingestion_run_id, source_id, status, started_at)
      VALUES (?, ?, ?, 'running', ?)
    `).run(id, runId, sourceId, nowIso());
    return id;
  }

  finishSourceRun(id: string, input: Omit<IngestionCounters, "errorCount"> & { status: "completed" | "failed" | "skipped"; errorMessage?: string }): void {
    this.db.prepare(`
      UPDATE ingestion_source_runs SET
        status = @status,
        finished_at = @finishedAt,
        fetched_count = @fetchedCount,
        inserted_count = @insertedCount,
        updated_count = @updatedCount,
        skipped_count = @skippedCount,
        error_message = @errorMessage
      WHERE id = @id
    `).run({ id, finishedAt: nowIso(), errorMessage: input.errorMessage ?? null, ...input });
  }

  latest(): IngestionRunSummary | null {
    const row = this.db.prepare(`
      SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT 1
    `).get() as {
      id: string; status: IngestionRunStatus; started_at: string; finished_at: string | null;
      fetched_count: number; inserted_count: number; updated_count: number;
      skipped_count: number; error_count: number; errors_json: string;
    } | undefined;
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      fetchedCount: row.fetched_count,
      insertedCount: row.inserted_count,
      updatedCount: row.updated_count,
      skippedCount: row.skipped_count,
      errorCount: row.error_count,
      errors: parseJson(row.errors_json, []),
    };
  }
}
