import pino, { type Logger } from "pino";
import { getEnv } from "@/config/env";

const globalForLogger = globalThis as unknown as { moodNewsLogger?: Logger };

export const logger = globalForLogger.moodNewsLogger ?? pino({
  level: getEnv().LOG_LEVEL,
  base: { service: "mood-news-grid" },
  redact: {
    paths: ["req.headers.authorization", "OPENROUTER_API_KEY", "GUARDIAN_API_KEY", "CRON_SECRET"],
    censor: "[REDACTED]",
  },
});

if (getEnv().NODE_ENV !== "production") globalForLogger.moodNewsLogger = logger;
