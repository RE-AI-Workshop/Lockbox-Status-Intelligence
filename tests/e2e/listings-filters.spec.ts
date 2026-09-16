import { expect, test } from "@playwright/test";
import {
  LISTINGS_PAGE_SIZE,
  activeOnly,
  addressLinks,
  citySelect,
  countLabel,
  daysCellTexts,
  daysColumnValues,
  discoverCityAndSearch,
  discoverSearchForAddress,
  ensureSort,
  firstPageFooterPattern,
  footerLabel,
  nextButton,
  openListings,
  pageLabel,
  previousButton,
  searchInput,
  secondPageFooterPattern,
  selectCityByMetro,
  selectCityNeedingPagination,
  selectOtherNamedCity,
  sortButton,
  statusCells,
} from "./listings";

/**
 * RAW-3 Zone D — acceptance-criteria gate (trimmed: 1:1 ACs + a few real edges).
 * Smoke stays a happy-path tour; this suite is the AC gate.
 */
test.describe("RAW-3 City default (All cities)", () => {
  test("Hard-refresh /listings → City shows All cities (first option)", async ({ page }) => {
    await openListings(page);
    await expect(citySelect(page).locator("option").first()).toHaveText("All cities");
    await page.reload();
    await expect(citySelect(page)).toHaveValue("ALL");
    await expect(citySelect(page).locator("option").first()).toHaveText("All cities");
  });

  test("Changing City to Atlanta then hard-refreshing again returns to All cities", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "ATL");
    await page.reload();
    await expect(citySelect(page)).toHaveValue("ALL");
  });
});

test.describe("RAW-3 Filter restore after listing detail", () => {
  test("Set City + search → open a row → Back to listings → City and search match what you set", async ({
    page,
  }) => {
    await openListings(page);
    const { metro, query, address } = await discoverCityAndSearch(page);

    await page.getByRole("link", { name: address, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: address })).toBeVisible();
    await page.getByRole("link", { name: "Back to listings" }).click();

    await expect(citySelect(page)).toHaveValue(metro);
    await expect(searchInput(page)).toHaveValue(query);
  });

  test("Also toggle Active only and Days to offer sort before leaving → both remain after return", async ({
    page,
  }) => {
    await openListings(page);
    const metro = await selectCityByMetro(page, "PHX");
    await activeOnly(page).check();
    await ensureSort(page, "Desc");

    const links = await addressLinks(page);
    const address = (await links.first().innerText()).trim();
    const query = await discoverSearchForAddress(page, address);

    await page.getByRole("link", { name: address, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: address })).toBeVisible();
    await page.getByRole("link", { name: "Back to listings" }).click();

    await expect(citySelect(page)).toHaveValue(metro);
    await expect(searchInput(page)).toHaveValue(query);
    await expect(activeOnly(page)).toBeChecked();
    await expect(sortButton(page)).toHaveText(/Days to offer Desc/);
  });

  test("Browser Back from detail restores the same state as Back to listings", async ({ page }) => {
    await openListings(page);
    const metro = await selectCityByMetro(page, "ATL");
    await activeOnly(page).check();
    await ensureSort(page, "Desc");
    const links = await addressLinks(page);
    const address = (await links.first().innerText()).trim();
    const query = await discoverSearchForAddress(page, address);

    await Promise.all([
      page.waitForURL(/\/listings\/LST-/),
      page.getByRole("link", { name: address, exact: true }).click(),
    ]);
    await expect(page.getByRole("heading", { level: 1, name: address })).toBeVisible();

    await Promise.all([
      page.waitForURL((url) => /\/listings\/?$/.test(url.pathname)),
      page.goBack(),
    ]);

    await expect(citySelect(page)).toHaveValue(metro);
    await expect(searchInput(page)).toHaveValue(query);
    await expect(activeOnly(page)).toBeChecked();
    await expect(sortButton(page)).toHaveText(/Days to offer Desc/);
  });
});

test.describe("RAW-3 Pagination", () => {
  test("Phoenix shows a footer with N of M where N < M", async ({ page }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");

    await expect(footerLabel(page)).toHaveText(firstPageFooterPattern());
    const footer = (await footerLabel(page).innerText()).trim();
    const match = footer.match(/Showing (\d+)–(\d+) of (\d+)/);
    expect(match).not.toBeNull();
    const shownTo = Number(match![2]);
    const total = Number(match![3]);
    expect(shownTo).toBeLessThan(total);
    expect(shownTo).toBe(LISTINGS_PAGE_SIZE);
    await expect(previousButton(page)).toBeDisabled();
  });

  test("A Next control appears and reveals additional rows", async ({ page }) => {
    await openListings(page);
    await selectCityNeedingPagination(page);

    await expect(nextButton(page)).toBeVisible();
    const links = await addressLinks(page);
    const firstAddress = (await links.first().innerText()).trim();

    await nextButton(page).click();
    await expect(footerLabel(page)).toHaveText(secondPageFooterPattern());
    const secondAddress = (await links.first().innerText()).trim();
    expect(secondAddress).not.toBe(firstAddress);
  });

  test("After paging, a listing beyond the first page is visible and clickable", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityNeedingPagination(page);

    await nextButton(page).click();
    await expect(footerLabel(page)).toHaveText(secondPageFooterPattern());

    const links = await addressLinks(page);
    const address = (await links.first().innerText()).trim();
    await links.first().click();
    await expect(page.getByRole("heading", { level: 1, name: address })).toBeVisible();
  });

  test("Previous returns to page 1 and changing City resets page", async ({ page }) => {
    await openListings(page);
    await selectCityNeedingPagination(page);
    await nextButton(page).click();
    await expect(footerLabel(page)).toHaveText(secondPageFooterPattern());

    await previousButton(page).click();
    await expect(footerLabel(page)).toHaveText(firstPageFooterPattern());
    await expect(previousButton(page)).toBeDisabled();

    await nextButton(page).click();
    await selectOtherNamedCity(page);
    await expect(footerLabel(page)).toHaveText(/Showing 1–/);
    await expect(pageLabel(page)).toHaveText(/Page 1 of/);
  });

  test("Empty search shows empty state; tight search hides pagination", async ({ page }) => {
    await openListings(page);
    await citySelect(page).selectOption("ALL");
    await searchInput(page).fill("zz-no-such-listing-xyz");
    await expect(page.getByText("No listings match this search.")).toBeVisible();
    await expect(footerLabel(page)).toHaveText("Showing 0 of 0 in this city.");
    await expect(nextButton(page)).toHaveCount(0);

    const { address } = await discoverCityAndSearch(page);
    await searchInput(page).fill(address);
    await expect(await addressLinks(page)).toHaveCount(1);
    await expect(footerLabel(page)).toHaveText(/Showing 1–1 of 1/);
    await expect(nextButton(page)).toHaveCount(0);
  });
});

test.describe("RAW-3 Active only", () => {
  test("Active only on → every Status cell is Active (no Sold, Pending, or Withdrawn)", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");
    await activeOnly(page).check();

    const statuses = await (await statusCells(page)).allTextContents();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((status) => status.trim() === "Active")).toBe(true);
    expect(statuses.some((status) => /Sold|Pending|Withdrawn/.test(status))).toBe(false);
  });

  test("Active only off → Sold and/or Pending rows can appear again for the same city", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");
    await activeOnly(page).check();
    await activeOnly(page).uncheck();

    const mixed = await (await statusCells(page)).allTextContents();
    expect(mixed.some((status) => /Sold|Pending|Withdrawn/.test(status))).toBe(true);
  });

  test("Row count drops when Active only is turned on and only Active listings are counted", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");

    const before = Number((await countLabel(page).innerText()).replace(/[^\d]/g, ""));
    await activeOnly(page).check();
    await expect(countLabel(page)).toHaveText(/listings with Active only on/);

    const after = Number((await countLabel(page).innerText()).replace(/[^\d]/g, ""));
    expect(after).toBeLessThan(before);

    const statuses = await (await statusCells(page)).allTextContents();
    expect(statuses.every((status) => status.trim() === "Active")).toBe(true);
  });
});

test.describe("RAW-3 Days to offer sort", () => {
  test("Days to offer Asc → each non-empty value is ≥ the value in the row above", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");
    await ensureSort(page, "Asc");

    const ascending = await daysColumnValues(page);
    expect(ascending.length).toBeGreaterThan(1);
    for (let i = 1; i < ascending.length; i += 1) {
      expect(ascending[i]).toBeGreaterThanOrEqual(ascending[i - 1]);
    }
  });

  test("Toggle to Days to offer Desc → each non-empty value is ≤ the value in the row above", async ({
    page,
  }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");

    await ensureSort(page, "Asc");
    const ascending = await daysColumnValues(page);

    await sortButton(page).click();
    await expect(sortButton(page)).toHaveText(/Days to offer Desc/);
    const descending = await daysColumnValues(page);

    for (let i = 1; i < descending.length; i += 1) {
      expect(descending[i]).toBeLessThanOrEqual(descending[i - 1]);
    }
    expect(descending).not.toEqual(ascending);
  });

  test("Toggle back to Asc → order matches criterion 1 again", async ({ page }) => {
    await openListings(page);
    await selectCityByMetro(page, "PHX");
    await searchInput(page).fill("");

    await ensureSort(page, "Asc");
    const ascending = await daysColumnValues(page);

    await sortButton(page).click();
    await expect(sortButton(page)).toHaveText(/Days to offer Desc/);

    await sortButton(page).click();
    await expect(sortButton(page)).toHaveText(/Days to offer Asc/);
    const again = await daysColumnValues(page);

    for (let i = 1; i < again.length; i += 1) {
      expect(again[i]).toBeGreaterThanOrEqual(again[i - 1]);
    }
    expect(again).toEqual(ascending);
  });

  test("Empty Days to offer values trail numeric ones", async ({ page }) => {
    await openListings(page);
    await selectCityNeedingPagination(page);
    await searchInput(page).fill("");

    async function goToLastPage() {
      const label = (await pageLabel(page).innerText()).trim();
      const pages = Number(label.match(/Page \d+ of (\d+)/)?.[1] ?? 0);
      expect(pages).toBeGreaterThan(0);
      const current = Number(label.match(/Page (\d+) of/)?.[1] ?? 1);
      for (let i = current; i < pages; i += 1) {
        await nextButton(page).click();
      }
      await expect(pageLabel(page)).toHaveText(new RegExp(`Page ${pages} of ${pages}`));
    }

    await ensureSort(page, "Asc");
    await goToLastPage();
    const ascTrimmed = await daysCellTexts(page);
    const firstEmptyAsc = ascTrimmed.findIndex((text) => text === "—");
    expect(firstEmptyAsc, "expected at least one empty Days to offer (—) on Asc last page").toBeGreaterThanOrEqual(0);
    expect(ascTrimmed.slice(0, firstEmptyAsc).every((text) => text !== "—")).toBe(true);
    expect(ascTrimmed.slice(firstEmptyAsc).every((text) => text === "—")).toBe(true);

    await ensureSort(page, "Desc");
    await goToLastPage();
    const descTrimmed = await daysCellTexts(page);
    const firstEmptyDesc = descTrimmed.findIndex((text) => text === "—");
    expect(firstEmptyDesc, "expected at least one empty Days to offer (—) on Desc last page").toBeGreaterThanOrEqual(0);
    expect(descTrimmed.slice(0, firstEmptyDesc).every((text) => text !== "—")).toBe(true);
    expect(descTrimmed.slice(firstEmptyDesc).every((text) => text === "—")).toBe(true);
  });
});
