import { expect, test } from "@playwright/test";

async function openListing(
  page: import("@playwright/test").Page,
  path: string,
  heading: string,
) {
  await page.goto(path);
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
}

function pricedComps(page: import("@playwright/test").Page) {
  return page.locator("#comps");
}

test("55 Rio Grande comps stay in Denver", async ({ page }) => {
  await openListing(page, "/listings/LST-DEN-0055?from=market", "55 Rio Grande St");

  const comps = pricedComps(page);
  await expect(comps.getByRole("heading", { level: 2 })).toHaveText("Comps");

  // AC: every Comp row city is Denver
  // pass
  const chips = comps.getByText("Denver", { exact: true });
  await expect(chips.first()).toBeVisible();
  expect(await chips.count()).toBeGreaterThan(0);
  // fail
  await expect(comps.getByText("Dallas", { exact: true })).toHaveCount(0);
  await expect(comps.getByText("Nashville", { exact: true })).toHaveCount(0);

  // AC: still shows up to N local homes when local matches exist
  // pass
  const rows = comps.locator("li");
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);
  expect(rowCount).toBeLessThanOrEqual(4);

  // AC: opening a listed comp never navigates to Dallas or Nashville
  // pass
  await comps.getByRole("link").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/Denver · DEN/)).toBeVisible();
  // fail
  await expect(page).not.toHaveURL(/LST-DAL|LST-BNA/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Main St|Oak Ln|West End/);

  await page.goto("/listings/LST-DEN-0055?from=market");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("55 Rio Grande St");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("55 Rio Grande St");

  // AC: refresh keeps the constrained set
  // pass
  await expect(pricedComps(page).getByText("Denver", { exact: true }).first()).toBeVisible();
  await expect(pricedComps(page).getByText("Dallas", { exact: true })).toHaveCount(0);
});

test("other watchlist details stay in the subject metro", async ({ page }) => {
  // AC: Charlotte / Phoenix / Atlanta watchlist details stay in-metro
  // pass
  await openListing(page, "/listings/LST-PHX-1842?from=market", "1842 W Maple Ave");
  await expect(pricedComps(page).getByText("Phoenix", { exact: true }).first()).toBeVisible();
  await expect(pricedComps(page).getByText("Dallas", { exact: true })).toHaveCount(0);

  await openListing(page, "/listings/LST-ATL-1108?from=market", "1108 Peachtree St");
  await expect(pricedComps(page).getByText("Atlanta", { exact: true }).first()).toBeVisible();
  await expect(pricedComps(page).getByText("Dallas", { exact: true })).toHaveCount(0);

  await openListing(page, "/listings/LST-CLT-0088?from=market", "88 South Blvd");
  await expect(pricedComps(page).getByText("Charlotte", { exact: true }).first()).toBeVisible();
  await expect(pricedComps(page).getByText("Dallas", { exact: true })).toHaveCount(0);
});
