import { expect, test } from "@playwright/test";

async function waitForShell(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
}

function kpiCard(page: import("@playwright/test").Page, label: string) {
  return page.getByText(label, { exact: true }).locator("..");
}

test("Market Boxes open matches Boxes Can open and does not use the locked caption", async ({ page }) => {
  await waitForShell(page);

  const whatsHere = page.locator("aside").filter({ hasText: "What's here" });
  const marketOpen = kpiCard(page, "Boxes open");
  const marketValue = (await marketOpen.locator(".stat").innerText()).trim();

  // AC: Boxes open label + number + caption never claim the same boxes are open and locked
  // pass
  await expect(marketOpen.getByText("Active listings whose box is not locked yet")).toBeVisible();
  // fail
  await expect(marketOpen.getByText("locked on Pending or Sold")).toHaveCount(0);

  // AC: Listings and Watchlist locked still render
  // NA — sibling cards are out of the open-caption fix; they must still be present
  await expect(whatsHere.getByText("Listings", { exact: true })).toBeVisible();
  await expect(whatsHere.getByText("Watchlist locked", { exact: true })).toBeVisible();

  await page.locator(".site-header").getByRole("link", { name: "Boxes", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Every listing has a box");

  const boxesOpen = kpiCard(page, "Can open");

  // AC: Market Boxes open equals Can open on /boxes
  // pass
  await expect(boxesOpen.locator(".stat")).toHaveText(marketValue);
  await expect(boxesOpen.getByText("Active listings whose box is not locked yet")).toBeVisible();

  // AC: locked Pending/Sold volume remains on a separate figure
  // NA — Auto-locked is not the open card
  await expect(kpiCard(page, "Auto-locked").locator(".stat")).toBeVisible();

  await page.locator(".site-header").getByRole("link", { name: "Market", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Did showings turn into a contract/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Did showings turn into a contract/);

  // AC: label, number, and caption still agree after navigation and refresh
  // pass
  await expect(kpiCard(page, "Boxes open").locator(".stat")).toHaveText(marketValue);
  await expect(kpiCard(page, "Boxes open").getByText("Active listings whose box is not locked yet")).toBeVisible();
});
