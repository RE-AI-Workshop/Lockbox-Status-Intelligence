import { describe, expect, it } from "vitest";
import aggregatesJson from "@/data/aggregates.json";
import { formatPercent } from "@/lib/format";
import { offerToCloseRate, showingToOfferRate } from "@/lib/intelligence";
import type { Aggregates, Listing, Offer } from "@/lib/types";

const aggregates = aggregatesJson as Aggregates;

function buildOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: "OFR-000",
    at: "2026-06-10T00:00:00.000Z",
    amount: 500_000,
    cash: false,
    accepted: true,
    closed: false,
    ...overrides,
  };
}

function buildListing(id: string, showingCount: number, offers: Offer[]): Listing {
  return {
    id,
    mls: `${id}-MLS`,
    address: `${id} Test St`,
    city: "Phoenix",
    metro: "PHX",
    zip: "85016",
    lat: 33.5,
    lng: -112.0,
    listPrice: 500_000,
    listedAt: "2026-06-01T00:00:00.000Z",
    status: "Active",
    beds: 3,
    baths: 2,
    sqft: 1800,
    showings: Array.from({ length: showingCount }, (_, index) => ({
      id: `${id}-SHW-${index}`,
      at: "2026-06-05T00:00:00.000Z",
    })),
    offers,
  };
}

describe("showingToOfferRate", () => {
  it("divides listings that got an offer by listings that got a showing", () => {
    const listings = [
      buildListing("L1", 1, [buildOffer({ id: "L1-O1" })]),
      buildListing("L2", 1, [buildOffer({ id: "L2-O1" })]),
      buildListing("L3", 1, []),
      buildListing("L4", 1, []),
    ];
    expect(showingToOfferRate(listings)).toBe(0.5);
  });

  it("ignores listings that never had a showing", () => {
    const listings = [
      buildListing("L1", 1, [buildOffer({ id: "L1-O1" })]),
      buildListing("L2", 0, []),
    ];
    expect(showingToOfferRate(listings)).toBe(1);
  });
});

describe("offerToCloseRate", () => {
  it("divides closed financed offers by financed offers", () => {
    const listings = [
      buildListing("L1", 1, [buildOffer({ id: "L1-O1", closed: true })]),
      buildListing("L2", 1, [
        buildOffer({ id: "L2-O1" }),
        buildOffer({ id: "L2-O2" }),
        buildOffer({ id: "L2-O3" }),
      ]),
    ];
    expect(offerToCloseRate(listings)).toBe(0.25);
  });

  it("leaves cash offers out of both the numerator and the denominator", () => {
    const listings = [
      buildListing("L1", 1, [
        buildOffer({ id: "L1-O1", cash: true, closed: true }),
        buildOffer({ id: "L1-O2", cash: true, closed: true }),
        buildOffer({ id: "L1-O3", closed: true }),
      ]),
    ];
    expect(offerToCloseRate(listings)).toBe(1);
  });

  it("returns 0 rather than dividing by zero when no financed offer exists", () => {
    const listings = [buildListing("L1", 1, [buildOffer({ id: "L1-O1", cash: true })])];
    expect(offerToCloseRate(listings)).toBe(0);
  });
});

describe("the Conversions rate cards", () => {
  // AC: "Showing to offer" and "Offer to close" no longer display the same value.
  it("measures two different quantities on the same listings", () => {
    const listings = [
      buildListing("L1", 1, [buildOffer({ id: "L1-O1", closed: true })]),
      buildListing("L2", 1, [
        buildOffer({ id: "L2-O1" }),
        buildOffer({ id: "L2-O2" }),
        buildOffer({ id: "L2-O3" }),
      ]),
      buildListing("L3", 1, []),
      buildListing("L4", 1, []),
    ];
    expect(showingToOfferRate(listings)).toBe(0.5);
    expect(offerToCloseRate(listings)).toBe(0.25);
    expect(showingToOfferRate(listings)).not.toBe(offerToCloseRate(listings));
  });

  // AC: "Showing to offer" and "Offer to close" no longer display the same value.
  it("renders as two different percentages on the shipped dataset", () => {
    expect(aggregates.showingToOfferRate).not.toBe(aggregates.offerToCloseRate);
    expect(formatPercent(aggregates.showingToOfferRate)).toBe("28.0%");
    expect(formatPercent(aggregates.offerToCloseRate)).toBe("24.4%");
  });

  // AC: each rate is consistent with the funnel counts on the same page.
  it("keeps the showing-to-offer card in step with the funnel counts", () => {
    const fromFunnel = aggregates.listingsWithOffers / aggregates.listingsWithShowings;
    expect(formatPercent(fromFunnel)).toBe(formatPercent(aggregates.showingToOfferRate));
  });

  // AC (amended): the ticket asks for 48.6%, which divides offers by listings.
  // Offer-denominated readings agree on 24.4%; the listing-denominated one does not.
  it("agrees with closed offers over total offers, not over listings with offers", () => {
    const perOffer = aggregates.closedCount / aggregates.offerCount;
    const perListing = aggregates.closedCount / aggregates.listingsWithOffers;

    expect(formatPercent(perOffer)).toBe("24.4%");
    expect(formatPercent(aggregates.offerToCloseRate)).toBe(formatPercent(perOffer));

    expect(formatPercent(perListing)).toBe("48.6%");
    expect(formatPercent(aggregates.offerToCloseRate)).not.toBe(formatPercent(perListing));
  });
});
