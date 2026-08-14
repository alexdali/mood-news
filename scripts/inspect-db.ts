import "./_bootstrap-env";
import { getDatabase } from "@/db/client";
import { heading, printJson } from "./_console";
import { OpsSummaryService } from "@/modules/ops/summary-service";

heading("Mood News Grid database summary");
printJson(new OpsSummaryService().get());

heading("Tables");
const tables = getDatabase().prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
console.table(tables);
