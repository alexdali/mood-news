import { createId } from "@/core/ids";

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? createId("request");
}
