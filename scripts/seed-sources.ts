import "./_bootstrap-env";
import { SourceRepository } from "@/db/repositories/source-repository";
import { buildSourceRegistry } from "@/modules/ingestion/source-registry";
import { heading } from "./_console";

heading("Seed configured source registry");
const repository = new SourceRepository();
const sources = buildSourceRegistry();
for (const source of sources) repository.upsert(source.metadata);
console.table(sources.map((source) => ({
  id: source.metadata.id,
  kind: source.metadata.kind,
  name: source.metadata.name,
  enabled: source.metadata.enabled,
})));
console.log(`Seeded ${sources.length} configured sources.`);
