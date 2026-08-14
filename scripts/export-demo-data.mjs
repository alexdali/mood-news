import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
const response = await fetch(`${baseUrl}/api/news?limit=20`);
if (!response.ok) throw new Error(`News API returned ${response.status}`);
const payload = await response.json();
if (!payload.ok || !Array.isArray(payload.data?.items)) throw new Error("Unexpected news API response");
await mkdir("reports", { recursive: true });
await writeFile("reports/demo-articles.json", JSON.stringify(payload.data, null, 2));
console.log(`Exported ${payload.data.items.length} articles to reports/demo-articles.json`);
