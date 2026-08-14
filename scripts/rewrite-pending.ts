import "./_bootstrap-env";
import { getEnv } from "@/config/env";
import { runRewritePendingJob } from "@/modules/jobs/rewrite-job";
import { fail, heading, printJson } from "./_console";

const requested = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1]);
const limit = Number.isFinite(requested) ? requested : getEnv().REWRITE_BATCH_SIZE;
heading(`Rewriting up to ${limit} pending articles`);
runRewritePendingJob(limit)
  .then(printJson)
  .catch(fail);
