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

test("mood selection persists in the URL and pressed state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Concerned" }).click();
  await expect(page).toHaveURL(/\?mood=concerned$/);
  await expect(page.getByRole("button", { name: "Concerned" })).toHaveAttribute("aria-pressed", "true");
});

test("language selection localizes the interface and preserves mood state", async ({ page }) => {
  await page.goto("/?mood=concerned");
  await page.getByRole("button", { name: "RU" }).click();
  await expect(page).toHaveURL(/mood=concerned&lang=ru/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: /Меняйте эмоциональную оптику/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Тревожно" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /Операции/i })).toBeVisible();
});

test("the page has no horizontal viewport overflow", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("a stored article opens the source comparison when data exists", async ({ page, request }) => {
  const response = await request.get("/api/news?mood=hopeful&limit=1");
  const payload = await response.json() as { data?: { items?: unknown[] } };
  if (!payload.data?.items?.length) test.skip(true, "Fresh CI database has no imported source records");
  await page.goto("/?mood=hopeful");
  const compare = page.getByRole("link", { name: "Compare" }).first();
  await expect(compare).toBeVisible();
  await compare.click();
  await expect(page.getByRole("heading", { name: "Source vs emotional rewrite" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /What (?:was|will be) made immutable/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to grid" })).toHaveAttribute("href", "/?mood=hopeful&lang=en");
});
