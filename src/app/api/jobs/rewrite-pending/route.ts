import { getEnv } from "@/config/env";
import { assertJobAuthorized } from "@/modules/jobs/job-auth";
import { runRewritePendingJob } from "@/modules/jobs/rewrite-job";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";
import { parseBoundedInteger } from "@/core/number";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    assertJobAuthorized(request);
    const limit = parseBoundedInteger(new URL(request.url).searchParams.get("limit"), {
      fallback: getEnv().REWRITE_BATCH_SIZE,
      min: 1,
      max: 100,
    });
    return jsonOk({ requestId, ...(await runRewritePendingJob(limit)) });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
