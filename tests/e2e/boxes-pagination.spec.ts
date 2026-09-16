import { expect, test, type Page } from "@playwright/test";

const TOTAL_BOXES = 2400;

async function openBoxes(page: Page) {
  await page.goto("/boxes");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Every listing has a box/);
  await expect(page.locator(".data-table tbody tr").first()).toBeVisible();
}

function footer(page: Page) {
  return page.getByText(/^Showing /);
}

// exact: true keeps these off the Next.js dev tools button that dev mode injects.
function nextButton(page: Page) {
  return page.getByRole("button", { name: "Next", exact: true });
}

function previousButton(page: Page) {
  return page.getByRole("button", { name: "Previous", exact: true });
}

// Serials repeat across a handful of listings, so identify a row by its listing link.
async function rowKeys(page: Page): Promise<string[]> {
  return page
    .locator(".data-table tbody tr td:nth-child(2) a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
}

test("next and previous walk the box table without overlapping rows", async ({ page }) => {
  await openBoxes(page);

  await expect(page.getByLabel("City")).toHaveValue("ALL");
  await expect(page.getByLabel("Lock")).toHaveValue("ALL");

  await expect(footer(page)).toHaveText(`Showing 1\u201380 of ${TOTAL_BOXES} boxes`);
  await expect(page.locator(".data-table tbody tr")).toHaveCount(80);
  await expect(previousButton(page)).toBeDisabled();
  await expect(nextButton(page)).toBeEnabled();

  const firstPage = await rowKeys(page);

  await nextButton(page).click();
  await expect(footer(page)).toHaveText(`Showing 81\u2013160 of ${TOTAL_BOXES} boxes`);
  await expect(previousButton(page)).toBeEnabled();

  const secondPage = await rowKeys(page);
  expect(secondPage).toHaveLength(80);
  expect(secondPage.filter((key) => firstPage.includes(key))).toEqual([]);

  await previousButton(page).click();
  await expect(footer(page)).toHaveText(`Showing 1\u201380 of ${TOTAL_BOXES} boxes`);
  expect(await rowKeys(page)).toEqual(firstPage);
  await expect(previousButton(page)).toBeDisabled();
});

test("paging to the end reaches every box exactly once", async ({ page }) => {
  await openBoxes(page);
  await page.getByLabel("Rows per page").selectOption({ label: "300 per page" });
  await expect(footer(page)).toHaveText(`Showing 1\u2013300 of ${TOTAL_BOXES} boxes`);

  const seen: string[] = [];
  for (let guard = 0; guard < 20; guard += 1) {
    seen.push(...(await rowKeys(page)));
    if (await nextButton(page).isDisabled()) break;
    const before = await footer(page).textContent();
    await nextButton(page).click();
    await expect(footer(page)).not.toHaveText(before ?? "");
  }

  await expect(footer(page)).toHaveText(`Showing 2101\u2013${TOTAL_BOXES} of ${TOTAL_BOXES} boxes`);
  await expect(nextButton(page)).toBeDisabled();
  await expect(previousButton(page)).toBeEnabled();

  expect(seen).toHaveLength(TOTAL_BOXES);
  expect(new Set(seen).size).toBe(TOTAL_BOXES);
});

test("changing a filter returns the table to page one", async ({ page }) => {
  await openBoxes(page);

  await nextButton(page).click();
  await expect(footer(page)).toHaveText(`Showing 81\u2013160 of ${TOTAL_BOXES} boxes`);

  await page.getByLabel("City").selectOption({ label: "Austin" });

  await expect(footer(page)).toHaveText("Showing 1\u201380 of 282 boxes");
  await expect(previousButton(page)).toBeDisabled();
});

test("a result set smaller than the page size cannot be paged", async ({ page }) => {
  await openBoxes(page);
  await page.getByLabel("Rows per page").selectOption({ label: "300 per page" });
  await page.getByLabel("City").selectOption({ label: "Austin" });

  await expect(footer(page)).toHaveText("Showing 1\u2013282 of 282 boxes");
  await expect(page.locator(".data-table tbody tr")).toHaveCount(282);

  if (await nextButton(page).count()) {
    await expect(nextButton(page)).toBeDisabled();
    await expect(previousButton(page)).toBeDisabled();
  }
});

test("a filter with no matches keeps the empty state", async ({ page }) => {
  await openBoxes(page);
  await page.getByLabel("Lock").selectOption({ label: "Manual shutoff" });

  await expect(page.getByText("No boxes match this filter.")).toBeVisible();
  await expect(footer(page)).toHaveText("Showing 0 of 0 boxes");
});

test("rows per page defaults to 80 and offers 50 through 300", async ({ page }) => {
  await openBoxes(page);

  const rowsPerPage = page.getByLabel("Rows per page");
  await expect(rowsPerPage).toHaveValue("80");

  for (const size of [50, 100, 150, 200, 250, 300]) {
    await expect(rowsPerPage.getByRole("option", { name: `${size} per page`, exact: true })).toBeAttached();
  }

  await rowsPerPage.selectOption({ label: "150 per page" });
  await expect(footer(page)).toHaveText(`Showing 1\u2013150 of ${TOTAL_BOXES} boxes`);
  await expect(page.locator(".data-table tbody tr")).toHaveCount(150);

  await nextButton(page).click();
  await expect(footer(page)).toHaveText(`Showing 151\u2013300 of ${TOTAL_BOXES} boxes`);
});
