import type { SourceFetchResult } from "@/modules/ingestion/types";
import type { SourceUpsertInput } from "@/db/repositories/source-repository";

export interface NewsSourceAdapter {
  readonly metadata: SourceUpsertInput;
  fetchLatest(): Promise<SourceFetchResult>;
}
