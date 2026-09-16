import { expect, test, type Page } from "@playwright/test";
import {
  activeOnly,
  citySelect,
  daysColumnValues,
  discoverCityAndSearch,
  ensureSort,
  firstPageFooterPattern,
  footerLabel,
  nextButton,
  openListings,
  searchInput,
  secondPageFooterPattern,
  selectCityNeedingPagination,
  sortButton,
  statusCells,
} from "./listings";
async function waitForShell(page: Page) {
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

// Happy-path tour only — RAW-3 AC gate is tests/e2e/listings-filters.spec.ts
test("listings smoke: city default, active only, pagination, sort, and filter restore", async ({ page }) => {
  await openListings(page);

  await expect(citySelect(page)).toHaveValue("ALL");

  await selectCityNeedingPagination(page);
  await expect(footerLabel(page)).toHaveText(firstPageFooterPattern());

  await ensureSort(page, "Asc");
  const ascending = await daysColumnValues(page);
  expect(ascending.length).toBeGreaterThan(1);
  for (let i = 1; i < ascending.length; i += 1) {
    expect(ascending[i]).toBeGreaterThanOrEqual(ascending[i - 1]);
  }

  await activeOnly(page).check();
  const activeStatuses = await (await statusCells(page)).allTextContents();
  expect(activeStatuses.length).toBeGreaterThan(0);
  expect(activeStatuses.every((status) => status.trim() === "Active")).toBe(true);

  await activeOnly(page).uncheck();
  await nextButton(page).click();
  await expect(footerLabel(page)).toHaveText(secondPageFooterPattern());

  const { metro, query, address } = await discoverCityAndSearch(page, "DEN");
  await page.getByRole("link", { name: address, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: address })).toBeVisible();
  await page.getByRole("link", { name: "Back to listings" }).click();
  await expect(citySelect(page)).toHaveValue(metro);
  await expect(searchInput(page)).toHaveValue(query);
  await expect(sortButton(page)).toBeVisible();
});

test("workshop is reachable from footer", async ({ page }) => {
  await waitForShell(page);
  await page.locator("footer").getByRole("link", { name: "Workshop" }).click();
  await expect(page).toHaveURL("/workshop");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("workshop prerequisites are available in their own tab", async ({ page }) => {
  await page.goto("/workshop");
  await page.getByRole("link", { name: "Prerequisites", exact: true }).click();

  await expect(page).toHaveURL("/workshop/prerequisites");
  await expect(page.getByRole("heading", { level: 1, name: "Prerequisites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Minimum setup for Lab 1" })).toBeVisible();
  await expect(page.getByText("The RAW Create screen is a complete fallback.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Need a hint?" })).toHaveCount(0);
});

test("Lab 1 hints stay closed until opened", async ({ page }) => {
  await page.goto("/workshop");

  const levelOne = page.getByRole("button", { name: /Level 1 · Where to look/ });
  const levelTwo = page.getByRole("button", { name: /Level 2 · What to try/ });

  await expect(levelOne).toHaveAttribute("aria-expanded", "false");
  await expect(levelTwo).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Read labels, helper text, and numbers together.")).not.toBeVisible();

  await levelOne.click();

  await expect(levelOne).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Read labels, helper text, and numbers together.")).toBeVisible();
  await expect(levelTwo).toHaveAttribute("aria-expanded", "false");
});
