import { describe, expect, it } from "vitest";
import exploreJson from "@/data/explore.json";
import { matchesQuery } from "@/lib/intelligence";
import { boxSerial, DEFAULT_LOCK_POLICY, lockboxForListing } from "@/lib/lockbox";
import type { Listing } from "@/lib/types";

function stubListing(
  id: string,
  overrides: Partial<Listing> = {},
): Listing {
  return {
    id,
    mls: "TEST",
    address: "1 Test St",
    city: "Dallas",
    metro: "DAL",
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
    ...overrides,
  };
}

/** RAW-20 duplicate pairs from the ticket. */
const RAW20_PAIRS = [
  {
    serial: "LBX-DAL-0001",
    compId: "LST-DAL-CMP1",
    soldId: "LST-DAL-SLD1",
    mainAddress: "240 Main St",
    commerceAddress: "81 Commerce St",
  },
  {
    serial: "LBX-DAL-0002",
    compId: "LST-DAL-CMP2",
    soldId: "LST-DAL-SLD2",
    mainAddress: "280 Main St",
    commerceAddress: "82 Commerce St",
  },
  {
    serial: "LBX-DAL-0003",
    compId: "LST-DAL-CMP3",
    soldId: "LST-DAL-SLD3",
    mainAddress: "320 Main St",
    commerceAddress: "83 Commerce St",
  },
] as const;

const exploreListings = (exploreJson as { listings: Listing[] }).listings;

function dallasListings(): Listing[] {
  return exploreListings.filter((listing) => listing.metro === "DAL" || listing.city === "Dallas");
}

function requireListing(id: string): Listing {
  const listing = exploreListings.find((row) => row.id === id);
  if (!listing) throw new Error(`Missing explore listing ${id}`);
  return listing;
}

/** Midday so quiet-hours policy does not flip Available → Quiet. */
const DAYTIME = new Date("2026-06-15T15:00:00.000Z");

describe("boxSerial (RAW-20)", () => {
  it("keeps numeric listing tails as lockbox digits", () => {
    expect(boxSerial(stubListing("LST-CLT-0088", { metro: "CLT", city: "Charlotte" }))).toBe(
      "LBX-CLT-0088",
    );
    expect(boxSerial(stubListing("LST-DAL-0014"))).toBe("LBX-DAL-0014");
  });

  it("keeps Dallas comps on LBX-DAL-000n and re-ids sold peers", () => {
    expect(boxSerial(stubListing("LST-DAL-CMP1"))).toBe("LBX-DAL-0001");
    expect(boxSerial(stubListing("LST-DAL-CMP2"))).toBe("LBX-DAL-0002");
    expect(boxSerial(stubListing("LST-DAL-CMP3"))).toBe("LBX-DAL-0003");

    const sold = [1, 2, 3].map((n) => boxSerial(stubListing(`LST-DAL-SLD${n}`)));
    expect(sold[0]).not.toBe("LBX-DAL-0001");
    expect(sold[1]).not.toBe("LBX-DAL-0002");
    expect(sold[2]).not.toBe("LBX-DAL-0003");
    expect(new Set(sold).size).toBe(3);
  });
});

describe("RAW-20 acceptance: LBX-DAL-0001/0002/0003 uniqueness", () => {
  it("AC1: each ticket serial appears exactly once on Dallas (and All cities) boxes", () => {
    const dallas = dallasListings();

    for (const pair of RAW20_PAIRS) {
      const dallasHits = dallas.filter((listing) => boxSerial(listing) === pair.serial);
      expect(dallasHits, pair.serial).toHaveLength(1);
      expect(dallasHits[0]?.address).toBe(pair.mainAddress);
      expect(dallasHits[0]?.status).toBe("Active");

      const allHits = exploreListings.filter((listing) => boxSerial(listing) === pair.serial);
      expect(allHits, `${pair.serial} all cities`).toHaveLength(1);

      // /boxes row serial comes from lockboxForListing
      expect(lockboxForListing(dallasHits[0]!, DEFAULT_LOCK_POLICY, DAYTIME).serial).toBe(
        pair.serial,
      );
    }
  });

  it("AC2: searching each ticket serial on listings returns exactly one Dallas row", () => {
    const dallas = dallasListings();

    for (const pair of RAW20_PAIRS) {
      const hits = dallas.filter((listing) => matchesQuery(listing, pair.serial));
      expect(hits, pair.serial).toHaveLength(1);
      expect(hits[0]?.address).toBe(pair.mainAddress);
      expect(hits[0]?.id).toBe(pair.compId);
    }
  });

  it("AC3: Main St Active and Commerce St Sold no longer share an LBX-* id", () => {
    for (const pair of RAW20_PAIRS) {
      const main = requireListing(pair.compId);
      const commerce = requireListing(pair.soldId);

      expect(main.address).toBe(pair.mainAddress);
      expect(main.status).toBe("Active");
      expect(commerce.address).toBe(pair.commerceAddress);
      expect(commerce.status).toBe("Sold");

      const mainSerial = boxSerial(main);
      const commerceSerial = boxSerial(commerce);

      expect(mainSerial).toBe(pair.serial);
      expect(commerceSerial).not.toBe(pair.serial);
      expect(commerceSerial).not.toBe(mainSerial);

      const mainBox = lockboxForListing(main, DEFAULT_LOCK_POLICY, DAYTIME);
      const commerceBox = lockboxForListing(commerce, DEFAULT_LOCK_POLICY, DAYTIME);
      expect(mainBox.mode).toBe("available");
      expect(commerceBox.mode).toBe("auto-locked");
      expect(mainBox.serial).not.toBe(commerceBox.serial);
    }
  });

  it("re-assigned Commerce St serials are unique across explore listings", () => {
    for (const pair of RAW20_PAIRS) {
      const commerce = requireListing(pair.soldId);
      const serial = boxSerial(commerce);
      const hits = exploreListings.filter((listing) => boxSerial(listing) === serial);
      expect(hits, serial).toHaveLength(1);
      expect(hits[0]?.id).toBe(pair.soldId);
    }
  });
});
