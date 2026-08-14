const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

async function check(path, predicate) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  if (!predicate(response, body)) {
    throw new Error(`Smoke test failed for ${path}: ${response.status} ${JSON.stringify(body)}`);
  }
  console.log(`✓ ${path} (${response.status})`);
  return body;
}

await check("/api/health", (response, body) => response.ok && body.ok && body.data?.database === "connected");
await check("/api/news?limit=10", (response, body) => response.ok && body.ok && Array.isArray(body.data?.items));
await check("/api/ops/summary", (response, body) => response.ok && body.ok && typeof body.data?.articles === "number");
console.log("Smoke test complete.");
