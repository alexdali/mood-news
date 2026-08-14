import { getEnv } from "@/config/env";
import { isMood } from "@/domain/news/mood";
import { NewsQueryService } from "@/modules/news/news-query-service";
import { serializeNewsCard } from "@/modules/news/serializers";
import { jsonError, jsonOk } from "@/server/api-response";
import { getRequestId } from "@/server/request-id";
import { parseBoundedInteger } from "@/core/number";
import { getLocale } from "@/i18n/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const moodParam = url.searchParams.get("mood");
    const mood = isMood(moodParam) ? moodParam : getEnv().DEFAULT_MOOD;
    const locale = getLocale(url.searchParams.get("lang"));
    const limit = parseBoundedInteger(url.searchParams.get("limit"), { fallback: getEnv().NEWS_PAGE_SIZE, min: 1, max: 100 });
    const offset = parseBoundedInteger(url.searchParams.get("offset"), { fallback: 0, min: 0, max: 100_000 });
    const items = new NewsQueryService().list({ mood, locale, limit, offset });
    return jsonOk({ requestId, mood, locale, items: items.map(serializeNewsCard) });
  } catch (error) {
    return jsonError(error, requestId);
  }
}
