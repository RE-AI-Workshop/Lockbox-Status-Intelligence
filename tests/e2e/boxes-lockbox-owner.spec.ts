import { expect, test } from "@playwright/test";

test("boxes table shows Lockbox Owner for every row", async ({ page }) => {
  await page.goto("/boxes");
  await expect(page.getByRole("heading", { level: 1, name: /Every listing has a box/ })).toBeVisible();

  // AC: The Boxes table includes a Lockbox Owner column for every listed box.
  const table = page.locator("table.data-table");
  await expect(table.getByRole("columnheader", { name: "Lockbox Owner" })).toBeVisible();

  const rows = table.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    const ownerCell = row.locator("td").nth(4);

    // AC: For each row, the ownership type is visible as Owned or Borrowed.
    await expect(ownerCell.getByText(/^(Owned|Borrowed)$/)).toBeVisible();

    // AC: For each row, the owner identity (name or org) is visible in that field.
    const ownerName = ownerCell.locator("p");
    await expect(ownerName).toBeVisible();
    await expect(ownerName).not.toHaveText("");
  }
});
