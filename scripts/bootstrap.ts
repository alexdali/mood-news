import "./_bootstrap-env";
import { getDatabase } from "@/db/client";
import { getEnv } from "@/config/env";
import { runIngestJob } from "@/modules/jobs/ingest-job";
import { runRewritePendingJob } from "@/modules/jobs/rewrite-job";
import { fail, heading, printJson } from "./_console";

async function main() {
  heading("1/3 Database");
  getDatabase();
  console.log("Migrations applied.");

  heading("2/3 Real news import");
  printJson(await runIngestJob("bootstrap"));

  heading("3/3 AI rewrites");
  if (!getEnv().OPENROUTER_API_KEY) {
    console.log("OPENROUTER_API_KEY is empty. Imported articles are ready; AI generation was skipped.");
  } else {
    printJson(await runRewritePendingJob(getEnv().REWRITE_BATCH_SIZE));
  }

  console.log("\nBootstrap complete. Run: npm run dev");
}

main().catch(fail);
