import { NextResponse } from "next/server";
import { AppError } from "@/core/errors";
import { logger } from "@/server/logger";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({
      ok: false,
      error: { code: error.code, message: error.message, details: error.details, requestId },
    }, { status: error.statusCode });
  }

  logger.error({ err: error, requestId }, "Unhandled API error");
  return NextResponse.json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Unexpected server error", requestId },
  }, { status: 500 });
}
