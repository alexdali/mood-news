import { AppError } from "@/core/errors";
import { RewriteOrchestrator } from "@/modules/news/rewrite-orchestrator";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";
import { checkRateLimit } from "@/server/rate-limit";
import { getLocale } from "@/i18n/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const key = forwarded ?? "local";
    const rate = checkRateLimit(`rewrite:${key}`, { limit: 8, windowMs: 60_000 });
    if (!rate.allowed) throw new AppError("Too many rewrite requests", "RATE_LIMITED", 429, { resetAt: rate.resetAt });
    const { id } = await context.params;
    const locale = getLocale(new URL(request.url).searchParams.get("lang"));
    const result = await new RewriteOrchestrator().rewriteById(id, locale);
    return jsonOk({ requestId, ...result });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
