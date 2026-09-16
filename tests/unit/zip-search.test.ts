import { describe, expect, it } from "vitest";
import { matchesQuery } from "@/lib/intelligence";
import type { Listing } from "@/lib/types";

function listing(overrides: Partial<Listing> & Pick<Listing, "id" | "zip">): Listing {
  return {
    mls: "PHX000000",
    address: "100 Main St",
    city: "Phoenix",
    metro: "PHX",
    lat: 33.5,
    lng: -112.0,
    listPrice: 400000,
    listedAt: "2026-06-01T00:00:00.000Z",
    status: "Active",
    beds: 3,
    baths: 2,
    sqft: 1800,
    showings: [],
    offers: [],
    ...overrides,
  };
}

const zip85016 = listing({ id: "LST-PHX-85016", zip: "85016", address: "1842 W Maple Ave" });
const zip85018 = listing({ id: "LST-PHX-85018", zip: "85018", address: "22 E Camelback Rd" });
const zip85012 = listing({ id: "LST-PHX-85012", zip: "85012", address: "9 N Central Ave" });

describe("matchesQuery ZIP search", () => {
  // AC: With City = Phoenix and Active only on, search 85016 — every visible row has ZIP 85016, and the count is greater than 0.
  it("matches listings whose ZIP is 85016 and rejects other ZIPs", () => {
    const phoenix = [zip85016, zip85018, zip85012];
    const matched = phoenix.filter((row) => matchesQuery(row, "85016"));

    expect(matched.length).toBeGreaterThan(0);
    expect(matched.every((row) => row.zip === "85016")).toBe(true);
    expect(matchesQuery(zip85018, "85016")).toBe(false);
  });

  // AC: Clear the Search field — Phoenix Active listings that are not 85016 can appear again.
  it("treats an empty search as matching every listing", () => {
    expect(matchesQuery(zip85016, "")).toBe(true);
    expect(matchesQuery(zip85018, "   ")).toBe(true);
    expect(matchesQuery(zip85012, "")).toBe(true);
  });

  // AC: Search a different Phoenix ZIP that exists when Search is empty — only that ZIP remains, and count is greater than 0.
  it("matches a different Phoenix ZIP such as 85018", () => {
    const phoenix = [zip85016, zip85018, zip85012];
    const matched = phoenix.filter((row) => matchesQuery(row, "85018"));

    expect(matched.length).toBeGreaterThan(0);
    expect(matched.every((row) => row.zip === "85018")).toBe(true);
    expect(matchesQuery(zip85016, "85018")).toBe(false);
  });
});
