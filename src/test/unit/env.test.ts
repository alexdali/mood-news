import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/config/env";

const originalNodeEnv = process.env.NODE_ENV;
const originalCronSecret = process.env.CRON_SECRET;
const mutableEnv = process.env as Record<string, string | undefined>;

afterEach(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
  if (originalCronSecret === undefined) delete mutableEnv.CRON_SECRET;
  else mutableEnv.CRON_SECRET = originalCronSecret;
  resetEnvForTests();
});

describe("environment safety", () => {
  it("rejects the development cron secret in production", () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.CRON_SECRET = "development-only-secret-change-me";
    resetEnvForTests();
    expect(() => getEnv()).toThrow(/CRON_SECRET must be changed/);
  });

  it("rejects the placeholder shipped in .env.example", () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.CRON_SECRET = "replace-with-a-long-random-value";
    resetEnvForTests();
    expect(() => getEnv()).toThrow(/CRON_SECRET must be changed/);
  });

  it("accepts a non-default production cron secret", () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.CRON_SECRET = "prod-secret-with-at-least-sixteen-characters";
    resetEnvForTests();
    expect(getEnv().CRON_SECRET).toBe("prod-secret-with-at-least-sixteen-characters");
  });
});
