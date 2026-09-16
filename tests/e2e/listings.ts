import { expect, type Page } from "@playwright/test";
import { LISTINGS_PAGE_SIZE } from "../../lib/listings";
import { METRO_ORDER, metroLabel } from "../../lib/metros";
import type { Metro } from "../../lib/types";

export { LISTINGS_PAGE_SIZE, metroLabel };

export async function openListings(page: Page) {
  await page.goto("/listings");
  await expect(page.getByRole("heading", { level: 1, name: /Browse lisitngs/ })).toBeVisible();
  await expect(citySelect(page)).toBeVisible();
}

export function citySelect(page: Page) {
  return page.getByLabel("City");
}

export function searchInput(page: Page) {
  return page.getByLabel("Search");
}

export function activeOnly(page: Page) {
  return page.getByLabel("Active only");
}

export function sortButton(page: Page) {
  return page.getByRole("button", { name: /Days to offer/ });
}

export function nextButton(page: Page) {
  return page.getByRole("button", { name: "Next", exact: true });
}

export function previousButton(page: Page) {
  return page.getByRole("button", { name: "Previous", exact: true });
}

export function countLabel(page: Page) {
  return page.locator("p").filter({ hasText: /^\d[\d,]* listings( with Active only on)?$/ });
}

export function footerLabel(page: Page) {
  return page.locator("p").filter({ hasText: /Showing .+ in this city\./ });
}

export function pageLabel(page: Page) {
  return page.locator("span").filter({ hasText: /^Page \d+ of \d+$/ });
}

async function columnIndex(page: Page, header: string): Promise<number> {
  const index = await page.locator("table.data-table thead th").evaluateAll((ths, name) => {
    return ths.findIndex((th) => th.textContent?.trim() === name);
  }, header);
  expect(index, `column "${header}"`).toBeGreaterThanOrEqual(0);
  return index;
}

export async function statusCells(page: Page) {
  const index = await columnIndex(page, "Status");
  return page.locator(`table.data-table tbody tr td:nth-child(${index + 1})`);
}

export async function addressLinks(page: Page) {
  const index = await columnIndex(page, "Address");
  return page.locator(`table.data-table tbody tr td:nth-child(${index + 1}) > a`);
}

export async function daysCellTexts(page: Page): Promise<string[]> {
  const index = await columnIndex(page, "Days to offer");
  return page.locator(`table.data-table tbody tr td:nth-child(${index + 1})`).evaluateAll((cells) =>
    cells.map((cell) => cell.textContent?.trim() ?? ""),
  );
}

export async function ensureSort(page: Page, direction: "Asc" | "Desc") {
  const button = sortButton(page);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await button.innerText()).includes(direction)) return;
    await button.click();
  }
  await expect(button).toHaveText(new RegExp(`Days to offer ${direction}`));
}

export async function daysColumnValues(page: Page): Promise<number[]> {
  const texts = await daysCellTexts(page);
  return texts
    .map((text) => {
      if (text === "—" || text === "") return null;
      const value = Number(text);
      return Number.isFinite(value) ? value : null;
    })
    .filter((value): value is number => value !== null);
}

export function firstPageFooterPattern() {
  return new RegExp(`Showing 1–${LISTINGS_PAGE_SIZE} of \\d+ in this city\\.`);
}

export function secondPageFooterPattern() {
  const start = LISTINGS_PAGE_SIZE + 1;
  const end = LISTINGS_PAGE_SIZE * 2;
  return new RegExp(`Showing ${start}–${end} of \\d+ in this city\\.`);
}

/** Select City by product metro label. */
export async function selectCityByLabel(page: Page, label: string): Promise<string> {
  const option = citySelect(page).locator("option", { hasText: new RegExp(`^${escapeRegExp(label)}$`) });
  const value = await option.getAttribute("value");
  expect(value, `City option "${label}"`).toBeTruthy();
  await citySelect(page).selectOption(value!);
  await expect(citySelect(page)).toHaveValue(value!);
  return value!;
}

export async function selectCityByMetro(page: Page, metro: Metro): Promise<string> {
  return selectCityByLabel(page, metroLabel(metro));
}

type CitySearchFixture = {
  metro: string;
  query: string;
  address: string;
};

/** City + full-address search (unique, no token probing). */
export async function discoverCityAndSearch(
  page: Page,
  preferredMetro?: Metro,
): Promise<CitySearchFixture> {
  const metro = preferredMetro
    ? await selectCityByMetro(page, preferredMetro)
    : await selectFirstNamedCity(page);
  await searchInput(page).fill("");
  const links = await addressLinks(page);
  await expect(links.first()).toBeVisible();

  const address = (await links.first().innerText()).trim();
  await searchInput(page).fill(address);
  await expect(links).toHaveCount(1);

  return { metro, query: address, address };
}

/** Full-address search under current filters (keeps the target row visible). */
export async function discoverSearchForAddress(page: Page, address: string): Promise<string> {
  await searchInput(page).fill(address);
  const links = await addressLinks(page);
  await expect(links).toHaveCount(1);
  return address;
}

/** First city option whose filtered set needs pagination (Next visible). */
export async function selectCityNeedingPagination(page: Page): Promise<string> {
  for (const metro of METRO_ORDER) {
    await selectCityByMetro(page, metro);
    await searchInput(page).fill("");
    if (await nextButton(page).isVisible()) {
      return metro;
    }
  }
  throw new Error("No metro needs pagination");
}

/** Another named city (for page-reset checks), not the current selection. */
export async function selectOtherNamedCity(page: Page): Promise<string> {
  const current = await citySelect(page).inputValue();
  for (const metro of METRO_ORDER) {
    if (metro === current) continue;
    return selectCityByMetro(page, metro);
  }
  throw new Error("No alternate city");
}

async function selectFirstNamedCity(page: Page): Promise<string> {
  return selectCityByMetro(page, METRO_ORDER[0]!);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
