import { expect, test } from "@playwright/test";

async function waitForShell(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
}

test("home loads with brand", async ({ page }) => {
  await waitForShell(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Throughline" })).toBeVisible();
});

test("main nav reaches every section", async ({ page }) => {
  await waitForShell(page);

  const routes = [
    { link: "Conversions", heading: /How showings become contracts/ },
    { link: "Demand", heading: /Where buyers are showing up/ },
    { link: "Listings", heading: /Browse lisitngs/ },
    { link: "Boxes", heading: /Every listing has a box/ },
    { link: "Market", heading: /Did showings turn into a contract/ },
  ];

  for (const route of routes) {
    await page.locator(".site-header").getByRole("link", { name: route.link, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
  }
});

test("watchlist listing opens and returns to market", async ({ page }) => {
  await waitForShell(page);
  await page.locator(".watch-card").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#lockbox")).toBeAttached();

  await page.getByRole("link", { name: "Back to market" }).click();
  await expect(page).toHaveURL("/");
});

test("workshop is reachable from footer", async ({ page }) => {
  await waitForShell(page);
  await page.locator("footer").getByRole("link", { name: "Workshop" }).click();
  await expect(page).toHaveURL("/workshop");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
