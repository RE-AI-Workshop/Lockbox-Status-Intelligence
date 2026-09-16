import { expect, test } from "@playwright/test";

function watchCard(page: import("@playwright/test").Page, address: string) {
  return page.locator(".watch-card").filter({ hasText: address });
}

test("South Blvd is not High + On track next to majority-negative feedback", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-header")).toBeVisible();

  const card = watchCard(page, "88 South Blvd");
  await expect(card.getByText("Demand Moderate", { exact: true })).toBeVisible();
  await expect(card.getByText("At risk", { exact: true })).toBeVisible();
  await expect(card.getByText("Demand High", { exact: true })).toHaveCount(0);
  await expect(card.getByText("On track", { exact: true })).toHaveCount(0);

  await card.click();
  await expect(page).toHaveURL(/\/listings\/LST-CLT-0088/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("88 South Blvd");
  await expect(page.getByText("Demand Moderate", { exact: true })).toBeVisible();
  await expect(page.getByText("67% negative feedback")).toBeVisible();
  await expect(page.getByText("At risk", { exact: true })).toBeVisible();
  await expect(page.getByText("Demand High", { exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Demand Moderate", { exact: true })).toBeVisible();
  await expect(page.getByText("At risk", { exact: true })).toBeVisible();
  await expect(page.getByText("67% negative feedback")).toBeVisible();
});

test("a healthy watchlist home can still be High and On track", async ({ page }) => {
  await page.goto("/");
  const card = watchCard(page, "1842 W Maple");
  await expect(card.getByText("Demand High", { exact: true })).toBeVisible();
  await expect(card.getByText("On track", { exact: true })).toBeVisible();
});
