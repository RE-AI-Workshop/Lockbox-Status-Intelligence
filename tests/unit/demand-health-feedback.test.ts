import { describe, expect, it } from "vitest";
import { getListing } from "@/lib/data";
import { buyerDemand, listingHealth, majorityNegative, negativeShare } from "@/lib/intelligence";

const south = () => getListing("LST-CLT-0088")!;
const maple = () => getListing("LST-PHX-1842")!;

describe("buyerDemand", () => {
  // AC: Demand is not High while negative feedback is ~67%
  it("pass: 88 South Blvd is Moderate", () => {
    expect(Math.round(negativeShare(south()) * 100)).toBe(67);
    expect(buyerDemand(south())).toBe("Moderate");
  });

  it("fail: does not stay High on that majority-negative volume", () => {
    expect(majorityNegative(south())).toBe(true);
    expect(buyerDemand(south())).not.toBe("High");
  });

  it("NA: 1842 W Maple can still be High", () => {
    expect(majorityNegative(maple())).toBe(false);
    expect(buyerDemand(maple())).toBe("High");
  });
});

describe("listingHealth", () => {
  // AC: 18 showings / 0 offers / majority-negative is not On track
  it("pass: 88 South Blvd is At risk", () => {
    const listing = south();
    expect(listing.showings.length).toBe(18);
    expect(listing.offers.length).toBe(0);
    expect(listingHealth(listing)).toBe("At risk");
  });

  it("fail: does not stay On track for that listing", () => {
    expect(listingHealth(south())).not.toBe("On track");
  });

  it("NA: 1842 W Maple can still be On track", () => {
    const listing = maple();
    expect(listing.showings.length).toBe(24);
    expect(listing.offers.length).toBe(0);
    expect(listingHealth(listing)).toBe("On track");
  });
});
