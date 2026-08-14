import { createId } from "@/core/ids";
import { JobLockRepository } from "@/db/repositories/job-lock-repository";
import { buildSourceRegistry } from "@/modules/ingestion/source-registry";
import { IngestService } from "@/modules/ingestion/ingest-service";

export async function runIngestJob(trigger = "manual") {
  const owner = createId("worker");
  const locks = new JobLockRepository();
  if (!locks.acquire("ingest", owner, 4 * 60_000)) {
    return { acquired: false, run: null };
  }
  try {
    const service = new IngestService(buildSourceRegistry());
    return { acquired: true, run: await service.run(trigger) };
  } finally {
    locks.release("ingest", owner);
  }
}
