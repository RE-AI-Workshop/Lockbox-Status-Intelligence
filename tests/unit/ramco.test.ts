import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";
import { ramcoMemberForListing } from "@/lib/ramco";
import type { Listing } from "@/lib/types";

const listing: Listing = {
  id: "LST-PHX-1842",
  mls: "PHX184200",
  address: "1842 W Maple Ave",
  city: "Phoenix",
  metro: "PHX",
  zip: "85016",
  lat: 33.5,
  lng: -112.0,
  listPrice: 529000,
  listedAt: "2026-06-01T00:00:00.000Z",
  status: "Active",
  beds: 4,
  baths: 3,
  sqft: 2410,
  showings: [],
  offers: [],
};

describe("ramcoMemberForListing", () => {
  it("returns a stable Active REALTOR for the same listing", () => {
    const first = ramcoMemberForListing(listing);
    const second = ramcoMemberForListing(listing);
    expect(first).toEqual(second);
    expect(first.memberType).toBe("REALTOR");
    expect(first.status).toBe("Active");
    expect(first.nrdsId).toMatch(/^\d{9}$/);
    expect(first.licenseNumber).toMatch(/^AZ /);
    expect(first.primaryAssociation).toContain("Phoenix");
    expect(() => formatDate(first.joinedAt)).not.toThrow();
    expect(() => formatDate(first.duesPaidThrough)).not.toThrow();
    expect(() => formatDate(first.lastSyncedAt)).not.toThrow();
  });

  it("varies first and last names independently", () => {
    const names = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      names.add(
        ramcoMemberForListing({
          ...listing,
          id: `LST-PHX-${String(i).padStart(5, "0")}`,
        }).name,
      );
    }
    expect(names.size).toBeGreaterThan(40);
  });

  it("formats join dates for many listing ids", () => {
    for (let i = 0; i < 80; i += 1) {
      const member = ramcoMemberForListing({
        ...listing,
        id: `LST-PHX-${String(i).padStart(5, "0")}`,
      });
      expect(Number.isNaN(new Date(member.joinedAt).getTime())).toBe(false);
      expect(() => formatDate(member.joinedAt)).not.toThrow();
    }
  });
});
