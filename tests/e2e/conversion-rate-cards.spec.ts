import { expect, test, type Page } from "@playwright/test";
import aggregates from "../../data/aggregates.json";

function asPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function rateCard(page: Page, label: string) {
  return page.locator(".kpi-card").filter({ has: page.getByText(label, { exact: true }) });
}

async function funnelCount(page: Page, label: string): Promise<number> {
  const panel = page.locator("section.panel").filter({ hasText: "From showing to close" });
  const value = panel.getByText(label, { exact: true }).locator("xpath=following-sibling::span").first();
  return Number((await value.innerText()).replace(/,/g, ""));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/conversions");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/How showings become contracts/);
});

// AC: "Showing to offer" and "Offer to close" no longer display the same value.
test("the two rate cards report different values", async ({ page }) => {
  const showingToOffer = await rateCard(page, "Showing to offer").locator(".stat").innerText();
  const offerToClose = await rateCard(page, "Offer to close").locator(".stat").innerText();

  expect(showingToOffer).toMatch(/^\d+\.\d%$/);
  expect(offerToClose).toMatch(/^\d+\.\d%$/);
  expect(offerToClose).not.toBe(showingToOffer);
});

// AC: the Offer to close card reads the offer-to-close value, not the showing-to-offer value.
test("the Offer to close card is bound to the offer-to-close series", async ({ page }) => {
  const card = rateCard(page, "Offer to close");

  await expect(card.locator(".stat")).toHaveText(asPercent(aggregates.offerToCloseRate));
  await expect(card.locator(".stat")).not.toHaveText(asPercent(aggregates.showingToOfferRate));
});

// AC: the card subtitle names the offer-to-close series, not showing-to-offer.
test("the Offer to close subtitle no longer names the showing-to-offer series", async ({ page }) => {
  const hint = rateCard(page, "Offer to close").locator("p").last();

  await expect(hint).not.toContainText(/showing[\s-]to[\s-]offer/i);
  await expect(hint).toContainText(/closed/i);
});

// AC: each rate is consistent with the funnel counts on the same page.
test("the Showing to offer card matches the funnel counts below it", async ({ page }) => {
  const withShowings = await funnelCount(page, "Listings with showings");
  const withOffers = await funnelCount(page, "Listings with offers");

  expect(withShowings).toBeGreaterThan(0);
  expect(withOffers).toBeGreaterThan(0);

  await expect(rateCard(page, "Showing to offer").locator(".stat")).toHaveText(
    asPercent(withOffers / withShowings),
  );
});

// AC: each rate is consistent with the funnel counts on the same page.
// The ticket's 48.6% divides closed offers by listings with offers, mixing offers and
// listings. The card is offer-denominated, so it must not echo that figure.
test("the Offer to close card is not the closed-offers-per-listing figure", async ({ page }) => {
  const withOffers = await funnelCount(page, "Listings with offers");
  const closedOffers = await funnelCount(page, "Closed offers");

  await expect(rateCard(page, "Offer to close").locator(".stat")).not.toHaveText(
    asPercent(closedOffers / withOffers),
  );
});
