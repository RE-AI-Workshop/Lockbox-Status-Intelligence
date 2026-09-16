import { expect, test, type Page } from "@playwright/test";

function mapPanel(page: Page) {
  return page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "Map", exact: true }) });
}

function boxesPanel(page: Page) {
  return page.locator("section.panel").filter({
    has: page.getByRole("heading", { name: "Boxes by city" }),
  });
}

async function demandSnapshot(page: Page) {
  const caption = mapPanel(page).locator("p").first();
  const rows = page.locator("table tbody tr");
  const metros = page.locator("table tbody tr td:nth-child(3)");
  const dots = page.locator("circle.map-dot");
  const labels = page.locator("text.map-label");
  const captionText = await caption.innerText();
  const rowCount = await rows.count();
  const dotCount = await dots.count();
  const metroNames = [...new Set(await metros.allTextContents())];
  const cityLabels = await labels.allTextContents();
  const match = captionText.match(/^(\d+) ZIPs on this map\. Click a ZIP\. Drag or scroll to move\.$/);
  const n = match ? Number(match[1]) : null;

  return { caption, captionText, rowCount, dotCount, metroNames, cityLabels, n };
}

async function expectSameN(page: Page, expected: number) {
  const snap = await demandSnapshot(page);
  await expect(snap.caption).toHaveText(`${expected} ZIPs on this map. Click a ZIP. Drag or scroll to move.`);
  expect(snap.n).toBe(expected);
  expect(snap.rowCount).toBe(expected);
  expect(snap.dotCount).toBe(expected);
  return snap;
}

test("demand city chips filter the table, caption, and map together", async ({ page }) => {
  await page.goto("/demand");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where buyers are showing up");
  await expect(boxesPanel(page).getByText("Click a city to filter the table and map.")).toBeVisible();

  await expectSameN(page, 32);

  await page.locator("button.metro-chip", { hasText: "Phoenix" }).click();
  const phoenix = await expectSameN(page, 4);
  expect(phoenix.metroNames).toEqual(["Phoenix"]);
  expect(phoenix.cityLabels).toEqual(["Phoenix"]);

  await page.locator("button.metro-chip", { hasText: "Atlanta" }).click();
  const atlanta = await expectSameN(page, 4);
  expect(atlanta.metroNames).toEqual(["Atlanta"]);
  expect(atlanta.cityLabels).toEqual(["Atlanta"]);

  await boxesPanel(page).getByRole("button", { name: /Phoenix/ }).click();
  const boxesPhoenix = await expectSameN(page, 4);
  expect(boxesPhoenix.metroNames).toEqual(["Phoenix"]);
  expect(boxesPhoenix.cityLabels).toEqual(["Phoenix"]);

  await page.getByRole("button", { name: "Show all ZIPs" }).click();
  const restored = await expectSameN(page, 32);
  expect(restored.metroNames).toEqual([
    "Phoenix",
    "Atlanta",
    "Austin",
    "Dallas",
    "Denver",
    "Nashville",
    "Charlotte",
    "Tampa",
  ]);
  expect(restored.cityLabels).toEqual([
    "Phoenix",
    "Atlanta",
    "Dallas",
    "Denver",
    "Tampa",
    "Charlotte",
    "Nashville",
    "Austin",
  ]);
});
