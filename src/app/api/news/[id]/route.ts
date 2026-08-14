import { getEnv } from "@/config/env";
import { isMood } from "@/domain/news/mood";
import { NewsDetailService } from "@/modules/news/news-detail-service";
import { serializeNewsDetail } from "@/modules/news/serializers";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";
import { getLocale } from "@/i18n/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const moodParam = url.searchParams.get("mood");
    const mood = isMood(moodParam) ? moodParam : getEnv().DEFAULT_MOOD;
    const locale = getLocale(url.searchParams.get("lang"));
    const view = new NewsDetailService().get(id, mood, locale);
    return jsonOk({ requestId, locale, article: serializeNewsDetail(view) });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
