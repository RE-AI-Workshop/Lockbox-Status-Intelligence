import { expect, test } from "@playwright/test";

test("Demand ZIP detail ranks within the selected metro", async ({ page }) => {
  await page.goto("/demand");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Where buyers are showing up/);
  await expect(page.getByRole("heading", { name: "Demand by ZIP" })).toBeVisible();

  // Overall rank 32 (ATL 30309) must show metro rank 4 of 4, not 32 of 32.
  await page.locator("#zip-30309").click();
  await expect(page.getByText("Rank 4 of 4 in this market")).toBeVisible();
  await expect(page.getByText(/Rank 32 of 32 in this market/)).toHaveCount(0);

  // Overall rank 2 (ATL 30308) is first in Atlanta — metro rank 1 of 4.
  await page.locator("#zip-30308").click();
  await expect(page.getByText("Rank 1 of 4 in this market")).toBeVisible();
  await expect(page.getByText(/Rank 2 of 32 in this market/)).toHaveCount(0);
});
