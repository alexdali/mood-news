import "./_bootstrap-env";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/config/env";
import { NewsRepository } from "@/db/repositories/news-repository";
import { OpenRouterClient } from "@/modules/ai/openrouter-client";
import { REWRITE_SYSTEM_PROMPT, buildRewriteUserPrompt } from "@/modules/ai/prompts";
import { protectArticleText } from "@/modules/fact-lock/placeholder";
import { validateProtectedVariant } from "@/modules/fact-lock/validator";
import { fail, heading } from "./_console";

async function main() {
  const env = getEnv();
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required for benchmarking");
  const limitArg = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 5);
  const articles = new NewsRepository().list({ limit: Math.min(Math.max(limitArg, 1), 20) });
  if (!articles.length) throw new Error("No real articles in database. Run npm run ingest first.");

  const models = [...new Set([env.AI_PRIMARY_MODEL, env.AI_FALLBACK_MODEL])];
  const client = new OpenRouterClient();
  const rows: Array<Record<string, unknown>> = [];
  heading(`Benchmarking ${models.length} models on ${articles.length} imported articles`);

  for (const model of models) {
    for (const article of articles) {
      const protectedText = protectArticleText(article.id, article.title, article.summary);
      const startedAt = Date.now();
      try {
        const result = await client.rewrite({
          model,
          systemPrompt: REWRITE_SYSTEM_PROMPT,
          userPrompt: buildRewriteUserPrompt({ protectedText, sourceName: article.sourceName, publishedAt: article.publishedAt }),
        });
        const validations = result.payload.variants.map((variant) => validateProtectedVariant({
          protectedText,
          original: { title: article.title, summary: article.summary },
          output: { title: variant.title, summary: variant.summary },
        }));
        rows.push({
          model,
          articleId: article.id,
          source: article.sourceName,
          passed: validations.every((validation) => validation.passed),
          averageScore: validations.reduce((sum, validation) => sum + validation.score, 0) / validations.length,
          latencyMs: result.latencyMs,
          costUsd: result.usage.costUsd,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          issues: validations.flatMap((validation) => validation.issues.map((issue) => issue.code)),
        });
      } catch (error) {
        rows.push({ model, articleId: article.id, source: article.sourceName, passed: false, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.message : String(error) });
      }
      console.log(`${model} · ${article.id} · ${rows.at(-1)?.passed ? "PASS" : "FAIL"}`);
    }
  }

  const summaries = models.map((model) => {
    const modelRows = rows.filter((row) => row.model === model);
    const passed = modelRows.filter((row) => row.passed).length;
    const numeric = (key: string) => modelRows.map((row) => Number(row[key] ?? 0));
    return {
      model,
      cases: modelRows.length,
      passed,
      passRate: modelRows.length ? passed / modelRows.length : 0,
      averageLatencyMs: Math.round(numeric("latencyMs").reduce((a, b) => a + b, 0) / Math.max(modelRows.length, 1)),
      totalCostUsd: numeric("costUsd").reduce((a, b) => a + b, 0),
    };
  });

  fs.mkdirSync("reports", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join("reports", `model-benchmark-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), summaries, rows }, null, 2));
  const markdown = [
    "# Model benchmark",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Model | Cases | Passed | Pass rate | Avg latency | Total cost |",
    "|---|---:|---:|---:|---:|---:|",
    ...summaries.map((item) => `| ${item.model} | ${item.cases} | ${item.passed} | ${(item.passRate * 100).toFixed(1)}% | ${item.averageLatencyMs} ms | $${item.totalCostUsd.toFixed(5)} |`),
    "",
    "A pass means all four mood variants passed deterministic Fact Lock checks.",
  ].join("\n");
  const mdPath = jsonPath.replace(/\.json$/, ".md");
  fs.writeFileSync(mdPath, markdown);
  console.table(summaries);
  console.log(`Reports written to ${jsonPath} and ${mdPath}`);
}

main().catch(fail);
