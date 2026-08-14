import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/config/env";

const originalNodeEnv = process.env.NODE_ENV;
const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
  resetEnvForTests();
});

describe("environment safety", () => {
  it("rejects the development cron secret in production", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "development-only-secret-change-me";
    resetEnvForTests();
    expect(() => getEnv()).toThrow(/CRON_SECRET must be changed/);
  });

  it("rejects the placeholder shipped in .env.example", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "replace-with-a-long-random-value";
    resetEnvForTests();
    expect(() => getEnv()).toThrow(/CRON_SECRET must be changed/);
  });

  it("accepts a non-default production cron secret", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "prod-secret-with-at-least-sixteen-characters";
    resetEnvForTests();
    expect(getEnv().CRON_SECRET).toBe("prod-secret-with-at-least-sixteen-characters");
  });
});
