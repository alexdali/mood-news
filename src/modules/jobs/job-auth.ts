import { getEnv } from "@/config/env";
import { UnauthorizedError } from "@/core/errors";
import { secureStringEquals } from "@/server/secrets";

export function assertJobAuthorized(request: Request): void {
  const env = getEnv();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-cron-secret");
  if (!secureStringEquals(bearer, env.CRON_SECRET) && !secureStringEquals(headerSecret, env.CRON_SECRET)) {
    throw new UnauthorizedError("Invalid job secret");
  }
}
