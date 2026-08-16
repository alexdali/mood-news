import { expect, test } from "@playwright/test";

test("operations exposes AI cost, request audit and expandable Fact Lock history", async ({ page }) => {
  await page.goto("/ops?lang=ru");

  await expect(page.getByRole("heading", { name: "Стоимость AI по дням UTC" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Журнал запросов к AI" })).toBeVisible();
  await expect(page.getByText("За всё время:")).toBeVisible();
  await expect(page.getByText(/Показать отклонённые ответы модели/)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
