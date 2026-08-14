import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}, z.boolean());

const csvFromEnv = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}, z.array(z.string().url()));

const localeCsvFromEnv = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}, z.array(z.enum(["en", "ru"])).min(1));

const unsafeProductionCronSecrets = new Set([
  "development-only-secret-change-me",
  "replace-with-a-long-random-value",
]);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_PATH: z.string().min(1).default("./data/mood-news.db"),
  DEFAULT_MOOD: z.enum(["neutral", "hopeful", "concerned", "ironic"]).default("neutral"),
  NEWS_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(24),

  CRON_SECRET: z.string().min(16).default("development-only-secret-change-me"),
  INGEST_INTERVAL_MS: z.coerce.number().int().min(30_000).default(300_000),
  REWRITE_INTERVAL_MS: z.coerce.number().int().min(10_000).default(60_000),
  REWRITE_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(20),
  WORKER_RUN_ONCE: booleanFromEnv.default(false),

  BBC_ENABLED: booleanFromEnv.default(true),
  BBC_RSS_FEEDS: csvFromEnv.default([
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
  ]),
  GUARDIAN_ENABLED: booleanFromEnv.default(true),
  GUARDIAN_API_KEY: z.string().optional().default(""),
  GUARDIAN_PAGE_SIZE: z.coerce.number().int().min(1).max(50).default(20),

  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_SITE_URL: z.string().url().default("http://localhost:3000"),
  OPENROUTER_APP_NAME: z.string().min(1).default("Mood News Grid"),
  AI_PRIMARY_MODEL: z.string().min(1).default("deepseek/deepseek-v4-flash-0731"),
  AI_FALLBACK_MODEL: z.string().min(1).default("openai/gpt-5.6-luna"),
  AI_REASONING_ENABLED: booleanFromEnv.default(false),
  AI_REASONING_EFFORT: z.enum(["low", "high", "max"]).default("low"),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(256).max(8_000).default(1_800),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(180_000).default(45_000),
  AI_MAX_PROVIDER_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  AI_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).max(10_000).default(600),
  AI_PROMPT_VERSION: z.string().min(1).default("mood-v1"),
  AI_REWRITE_LOCALES: localeCsvFromEnv.default(["en", "ru"]),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.35),
  AI_ENABLE_RESPONSE_HEALING: booleanFromEnv.default(false),

  MAX_ARTICLE_SUMMARY_CHARS: z.coerce.number().int().min(200).max(10_000).default(1_800),
  MAX_REWRITE_LENGTH_RATIO: z.coerce.number().min(1).max(5).default(2.4),
  MIN_REWRITE_LENGTH_RATIO: z.coerce.number().min(0.1).max(1).default(0.45),
  MAX_DAILY_AI_COST_USD: z.coerce.number().min(0).max(1_000).default(2),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === "production" && unsafeProductionCronSecrets.has(env.CRON_SECRET)) {
    ctx.addIssue({
      code: "custom",
      path: ["CRON_SECRET"],
      message: "CRON_SECRET must be changed before production startup",
    });
  }
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (!cached) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid environment configuration:\n${details}`);
    }
    cached = result.data;
  }
  return cached;
}

export function resetEnvForTests(): void {
  cached = undefined;
}
