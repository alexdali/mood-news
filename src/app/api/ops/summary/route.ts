import { OpsSummaryService } from "@/modules/ops/summary-service";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    return jsonOk({ requestId, ...new OpsSummaryService().get() });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
