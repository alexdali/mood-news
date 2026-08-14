export type IngestionRunStatus = "running" | "completed" | "partial" | "failed";

export type IngestionRunSummary = {
  id: string;
  status: IngestionRunStatus;
  startedAt: string;
  finishedAt: string | null;
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ sourceId: string; message: string }>;
};
