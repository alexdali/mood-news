import { expect, test } from "@playwright/test";

test("home exposes the mood controls and data provenance message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Change the emotional lens/i })).toBeVisible();
  await expect(page.getByRole("group", { name: /Choose news mood/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Neutral" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Operations/i })).toBeVisible();
});

test("health endpoint reports configured routing", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.ok).toBe(true);
  expect(payload.data.primaryModel).toBeTruthy();
  expect(payload.data.fallbackModel).toBeTruthy();
});
