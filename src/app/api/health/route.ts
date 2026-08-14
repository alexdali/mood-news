import { getDatabase } from "@/db/client";
import { getEnv } from "@/config/env";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";
import { getConfiguredSources } from "@/config/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const database = getDatabase();
    database.prepare("SELECT 1 AS ok").get();
    const env = getEnv();
    return jsonOk({
      status: "ok",
      requestId,
      database: "connected",
      aiConfigured: Boolean(env.OPENROUTER_API_KEY),
      guardianConfigured: Boolean(env.GUARDIAN_API_KEY),
      primaryModel: env.AI_PRIMARY_MODEL,
      fallbackModel: env.AI_FALLBACK_MODEL,
      configuredSources: getConfiguredSources().map(({ id, kind, name, enabled }) => ({ id, kind, name, enabled })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
