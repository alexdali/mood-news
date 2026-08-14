import { assertJobAuthorized } from "@/modules/jobs/job-auth";
import { runIngestJob } from "@/modules/jobs/ingest-job";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    assertJobAuthorized(request);
    return jsonOk({ requestId, ...(await runIngestJob("api")) });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
