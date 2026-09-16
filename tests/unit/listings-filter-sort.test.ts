import { describe, expect, it } from "vitest";
import { compareDaysToOffer, isActiveStatus } from "@/lib/intelligence";
import type { Listing, ListingStatus } from "@/lib/types";

function listingWith(
  status: ListingStatus,
  listedAt: string,
  offerAt: string | null,
): Listing {
  return {
    id: `${status}-${listedAt}`,
    mls: "MLS",
    address: "1 Test St",
    city: "Phoenix",
    metro: "PHX",
    zip: "85016",
    lat: 0,
    lng: 0,
    listPrice: 400000,
    listedAt,
    status,
    beds: 3,
    baths: 2,
    sqft: 1500,
    showings: [],
    offers: offerAt
      ? [
          {
            id: "o1",
            at: offerAt,
            amount: 400000,
            cash: false,
            accepted: false,
            closed: false,
          },
        ]
      : [],
  };
}

describe("isActiveStatus (RAW-3)", () => {
  it("treats only Active as active", () => {
    expect(isActiveStatus("Active")).toBe(true);
    expect(isActiveStatus("Pending")).toBe(false);
    expect(isActiveStatus("Sold")).toBe(false);
    expect(isActiveStatus("Withdrawn")).toBe(false);
  });
});

describe("compareDaysToOffer (RAW-3)", () => {
  const faster = listingWith("Sold", "2024-01-01T00:00:00.000Z", "2024-01-11T00:00:00.000Z"); // 10 days
  const slower = listingWith("Sold", "2024-01-01T00:00:00.000Z", "2024-01-28T00:00:00.000Z"); // 27 days
  const none = listingWith("Active", "2024-01-01T00:00:00.000Z", null);

  it("sorts smaller days first for Asc", () => {
    const sorted = [slower, faster, none].sort((a, b) => compareDaysToOffer(a, b, "asc"));
    expect(sorted.map((l) => l.id)).toEqual([faster.id, slower.id, none.id]);
  });

  it("sorts larger days first for Desc", () => {
    const sorted = [faster, slower, none].sort((a, b) => compareDaysToOffer(a, b, "desc"));
    expect(sorted.map((l) => l.id)).toEqual([slower.id, faster.id, none.id]);
  });
});
