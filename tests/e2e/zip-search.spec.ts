import { expect, test } from "@playwright/test";

test("ZIP search on Listings filters by five-digit ZIP", async ({ page }) => {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Browse lisitngs/);

  await page.getByLabel("City").selectOption("PHX");
  await page.getByLabel("Active only").check();

  // AC: With City = Phoenix and Active only on, search 85016 — every visible row has ZIP 85016, and the count is greater than 0.
  await page.getByPlaceholder("85016").fill("85016");
  const countLine = page.locator("p").filter({ hasText: /listings with Active only on/ });
  await expect(countLine).toBeVisible();
  await expect(countLine).not.toHaveText(/^0 listings/);
  await expect(page.getByText("No listings match this search.")).toHaveCount(0);

  const zipCells = page.locator("table.data-table tbody tr td:nth-child(2)");
  await expect(zipCells.first()).toBeVisible();
  const zip85016Count = await zipCells.count();
  expect(zip85016Count).toBeGreaterThan(0);
  for (let i = 0; i < zip85016Count; i += 1) {
    await expect(zipCells.nth(i)).toHaveText("85016");
  }

  // AC: Clear the Search field — Phoenix Active listings that are not 85016 can appear again.
  await page.getByPlaceholder("85016").fill("");
  await expect(countLine).toBeVisible();
  await expect(countLine).not.toHaveText(/^0 listings/);
  const clearedZips = await zipCells.allTextContents();
  expect(clearedZips.length).toBeGreaterThan(0);
  expect(clearedZips.some((zip) => zip.trim() !== "85016")).toBe(true);

  // AC: Search a different Phoenix ZIP — only that ZIP remains, and count is greater than 0.
  const otherZip = clearedZips.map((zip) => zip.trim()).find((zip) => zip !== "85016");
  expect(otherZip).toBeTruthy();

  await page.getByPlaceholder("85016").fill(otherZip!);
  await expect(page.getByText("No listings match this search.")).toHaveCount(0);
  const otherZipCells = page.locator("table.data-table tbody tr td:nth-child(2)");
  const otherCount = await otherZipCells.count();
  expect(otherCount).toBeGreaterThan(0);
  for (let i = 0; i < otherCount; i += 1) {
    await expect(otherZipCells.nth(i)).toHaveText(otherZip!);
  }
});
