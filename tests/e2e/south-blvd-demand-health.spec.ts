import { expect, test } from "@playwright/test";

async function waitForShell(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
}

function watchCard(page: import("@playwright/test").Page, address: string) {
  return page.locator(".watch-card").filter({ hasText: address });
}

test("South Blvd demand and health match the showing log", async ({ page }) => {
  await waitForShell(page);

  const card = watchCard(page, "88 South Blvd");

  // AC: Demand is not High while negative feedback is ~67%
  // pass
  await expect(card.getByText("Demand Moderate", { exact: true })).toBeVisible();
  // fail
  await expect(card.getByText("Demand High", { exact: true })).toHaveCount(0);

  // AC: 18 showings / 0 offers / majority-negative is not On track
  // pass
  await expect(card.getByText("At risk", { exact: true })).toBeVisible();
  // fail
  await expect(card.getByText("On track", { exact: true })).toHaveCount(0);

  await card.click();
  await expect(page).toHaveURL(/\/listings\/LST-CLT-0088/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("88 South Blvd");

  // AC: Market watchlist card matches listing detail
  // pass
  await expect(page.getByText("Demand Moderate", { exact: true })).toBeVisible();
  await expect(page.getByText("At risk", { exact: true })).toBeVisible();
  await expect(page.getByText("67% negative feedback")).toBeVisible();

  // AC: badges stay consistent after refresh
  // pass
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("88 South Blvd");
  await expect(page.getByText("Demand Moderate", { exact: true })).toBeVisible();
  await expect(page.getByText("At risk", { exact: true })).toBeVisible();
  await expect(page.getByText("67% negative feedback")).toBeVisible();
});

test("a healthy watchlist home can still be High and On track", async ({ page }) => {
  await waitForShell(page);

  const card = watchCard(page, "1842 W Maple");

  // AC: a genuinely healthy listing can still be On track / High demand
  // NA — Maple is not majority-negative; this criterion does not require a change
  await expect(card.getByText("Demand High", { exact: true })).toBeVisible();
  await expect(card.getByText("On track", { exact: true })).toBeVisible();
});
