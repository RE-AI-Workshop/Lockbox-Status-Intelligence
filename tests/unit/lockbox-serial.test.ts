import { describe, expect, it } from "vitest";
import { boxSerial } from "@/lib/lockbox";
import type { Listing } from "@/lib/types";

function stubListing(id: string, metro: Listing["metro"] = "DAL"): Listing {
  return {
    id,
    mls: "TEST",
    address: "1 Test St",
    city: "Dallas",
    metro,
    zip: "75201",
    lat: 0,
    lng: 0,
    listPrice: 100000,
    listedAt: "2026-01-01T00:00:00.000Z",
    status: "Active",
    beds: 2,
    baths: 1,
    sqft: 1000,
    showings: [],
    offers: [],
  };
}

describe("boxSerial", () => {
  it("keeps numeric listing tails as lockbox digits", () => {
    expect(boxSerial(stubListing("LST-CLT-0088", "CLT"))).toBe("LBX-CLT-0088");
    expect(boxSerial(stubListing("LST-DAL-0014"))).toBe("LBX-DAL-0014");
  });

  it("gives unique serials for letter-coded Dallas comps and sold peers", () => {
    const comps = [1, 2, 3].map((n) => boxSerial(stubListing(`LST-DAL-CMP${n}`)));
    const sold = [1, 2, 3].map((n) => boxSerial(stubListing(`LST-DAL-SLD${n}`)));
    const all = [...comps, ...sold];
    expect(new Set(all).size).toBe(all.length);
    expect(comps[0]).not.toBe(sold[0]);
    expect(comps[1]).not.toBe(sold[1]);
    expect(comps[2]).not.toBe(sold[2]);
  });
});
