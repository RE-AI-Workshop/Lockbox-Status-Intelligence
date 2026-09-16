import { expect, test } from "@playwright/test";

function kpiCard(page: import("@playwright/test").Page, label: string) {
  return page.getByText(label, { exact: true }).locator("..");
}

test("Market Boxes open matches Boxes Can open and does not use the locked caption", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-header")).toBeVisible();

  const marketOpen = kpiCard(page, "Boxes open");
  const marketValue = (await marketOpen.locator(".stat").innerText()).trim();
  await expect(marketOpen.getByText("Active listings whose box is not locked yet")).toBeVisible();
  await expect(marketOpen.getByText("locked on Pending or Sold")).toHaveCount(0);

  const whatsHere = page.locator("aside").filter({ hasText: "What's here" });
  await expect(whatsHere.getByText("Listings", { exact: true })).toBeVisible();
  await expect(whatsHere.getByText("Watchlist locked", { exact: true })).toBeVisible();

  await page.locator(".site-header").getByRole("link", { name: "Boxes", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Every listing has a box");

  const boxesOpen = kpiCard(page, "Can open");
  await expect(boxesOpen.locator(".stat")).toHaveText(marketValue);
  await expect(boxesOpen.getByText("Active listings whose box is not locked yet")).toBeVisible();
  await expect(kpiCard(page, "Auto-locked").locator(".stat")).toBeVisible();

  await page.locator(".site-header").getByRole("link", { name: "Market", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Did showings turn into a contract/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Did showings turn into a contract/);
  await expect(kpiCard(page, "Boxes open").locator(".stat")).toHaveText(marketValue);
  await expect(kpiCard(page, "Boxes open").getByText("Active listings whose box is not locked yet")).toBeVisible();
});
