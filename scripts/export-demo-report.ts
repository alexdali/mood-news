import "./_bootstrap-env";
import fs from "node:fs";
import { OpsSummaryService } from "@/modules/ops/summary-service";
import { formatUsd } from "@/modules/ops/cost";
import { heading } from "./_console";

const summary = new OpsSummaryService().get();
const markdown = `# Mood News Grid demo evidence

Generated: ${new Date().toISOString()}

## Data

- Active real-source articles: ${summary.articles}
- Validated rewrites: ${summary.validatedRewrites}
- Latest ingestion status: ${summary.latestIngestion?.status ?? "not run"}
- Latest ingestion fetched: ${summary.latestIngestion?.fetchedCount ?? 0}

## AI

- Primary: \`${summary.models.primary}\`
- Fallback: \`${summary.models.fallback}\`
- Prompt version: \`${summary.models.promptVersion}\`
- Requests in last 24 hours: ${summary.aiLast24Hours.requests}
- Failures in last 24 hours: ${summary.aiLast24Hours.failures}
- Cost in last 24 hours: ${formatUsd(summary.aiLast24Hours.costUsd)}

## Validation

- Recorded checks: ${summary.validation.total}
- Passed checks: ${summary.validation.passed}
- Pass rate: ${(summary.validation.passRate * 100).toFixed(1)}%

This report is generated from the SQLite audit tables, not manually edited.
`;
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/demo-evidence.md", markdown);
heading("Demo evidence exported");
console.log("reports/demo-evidence.md");
