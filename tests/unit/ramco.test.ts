import { describe, expect, it } from "vitest";
import rosterJson from "@/data/ramco-members.json";
import { formatDate } from "@/lib/format";
import { buildRamcoMember, ramcoMemberForListing, type RamcoRosterFile } from "@/lib/ramco";
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
  it("returns the roster blob record for a stored listing", () => {
    const roster = rosterJson as RamcoRosterFile;
    const member = ramcoMemberForListing(listing);
    expect(member).toEqual(roster.members[listing.id]);
    expect(member.memberType).toBe("REALTOR");
    expect(member.nrdsId).toMatch(/^\d{9}$/);
    expect(member.licenseNumber).toMatch(/^AZ /);
    expect(() => formatDate(member.joinedAt)).not.toThrow();
  });

  it("keeps the same name and member status from list to detail", () => {
    const fromList = ramcoMemberForListing(listing);
    const fromDetail = ramcoMemberForListing({ ...listing });
    expect(fromList.name).toBe(fromDetail.name);
    expect(fromList.status).toBe(fromDetail.status);
  });

  it("includes a few inactive members in the roster", () => {
    const roster = rosterJson as RamcoRosterFile;
    const inactive = Object.values(roster.members).filter((member) => member.status === "Inactive");
    expect(inactive.length).toBeGreaterThan(20);
    expect(inactive.length).toBeLessThan(400);
  });

  it("varies first and last names independently", () => {
    const names = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      names.add(
        buildRamcoMember({
          ...listing,
          id: `LST-PHX-${String(i).padStart(5, "0")}`,
        }).name,
      );
    }
    expect(names.size).toBeGreaterThan(40);
  });
});
