import "./_bootstrap-env";
import { runIngestJob } from "@/modules/jobs/ingest-job";
import { fail, heading, printJson } from "./_console";

heading("Importing current real news");
runIngestJob("cli")
  .then(printJson)
  .catch(fail);
