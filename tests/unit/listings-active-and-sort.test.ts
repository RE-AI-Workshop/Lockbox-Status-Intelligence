import { describe, expect, it } from "vitest";
import { compareDaysToOffer, daysShowingToOffer, isActiveStatus } from "@/lib/intelligence";
import type { Listing, ListingStatus } from "@/lib/types";

function listing(partial: Partial<Listing> & Pick<Listing, "id" | "status">): Listing {
  return {
    mls: "PHX000000",
    address: "100 Main St",
    city: "Phoenix",
    metro: "PHX",
    zip: "85016",
    lat: 33.5,
    lng: -112.0,
    listPrice: 400000,
    listedAt: "2026-01-01T00:00:00.000Z",
    beds: 3,
    baths: 2,
    sqft: 1800,
    showings: [],
    offers: [],
    ...partial,
  };
}

function withDaysToOffer(id: string, days: number | null, status: ListingStatus = "Active"): Listing {
  if (days == null) {
    return listing({ id, status, offers: [] });
  }
  const listedAt = "2026-01-01T00:00:00.000Z";
  const offerAt = new Date(Date.parse(listedAt) + days * 86_400_000).toISOString();
  return listing({
    id,
    status,
    listedAt,
    offers: [{ id: `${id}-offer`, at: offerAt, amount: 400000, cash: false, accepted: false, closed: false }],
  });
}

describe("RAW-3 Active only", () => {
  it("Active only on → every Status cell is Active (no Sold, Pending, or Withdrawn)", () => {
    expect(isActiveStatus("Active")).toBe(true);
    expect(isActiveStatus("Sold")).toBe(false);
    expect(isActiveStatus("Pending")).toBe(false);
    expect(isActiveStatus("Withdrawn")).toBe(false);

    const rows = [
      listing({ id: "a", status: "Active" }),
      listing({ id: "s", status: "Sold" }),
      listing({ id: "p", status: "Pending" }),
      listing({ id: "w", status: "Withdrawn" }),
    ];
    const filtered = rows.filter((row) => isActiveStatus(row.status));
    expect(filtered.every((row) => row.status === "Active")).toBe(true);
  });

  it("Active only off → Sold and/or Pending rows can appear again for the same city", () => {
    const rows = [
      listing({ id: "a", status: "Active" }),
      listing({ id: "s", status: "Sold" }),
      listing({ id: "p", status: "Pending" }),
    ];
    const applyActiveOnly = (source: typeof rows, on: boolean) =>
      on ? source.filter((row) => isActiveStatus(row.status)) : source;

    const filtered = applyActiveOnly(rows, true);
    const unfiltered = applyActiveOnly(rows, false);

    expect(filtered.every((row) => row.status === "Active")).toBe(true);
    expect(filtered.some((row) => row.status === "Sold" || row.status === "Pending")).toBe(false);
    expect(unfiltered.some((row) => row.status === "Sold" || row.status === "Pending")).toBe(true);
    expect(unfiltered.length).toBeGreaterThan(filtered.length);
  });

  it("Row count drops when Active only is turned on and only Active listings are counted", () => {
    const rows = [
      listing({ id: "a1", status: "Active" }),
      listing({ id: "a2", status: "Active" }),
      listing({ id: "s1", status: "Sold" }),
      listing({ id: "p1", status: "Pending" }),
      listing({ id: "w1", status: "Withdrawn" }),
    ];
    const filtered = rows.filter((row) => isActiveStatus(row.status));
    expect(filtered.length).toBeLessThan(rows.length);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((row) => row.status)).toEqual(["Active", "Active"]);
  });
});

describe("RAW-3 Days to offer sort", () => {
  it("Days to offer Asc → each non-empty value is ≥ the value in the row above", () => {
    const rows = [withDaysToOffer("fast", 5), withDaysToOffer("mid", 12), withDaysToOffer("slow", 27)];
    const sorted = [...rows].sort((a, b) => compareDaysToOffer(a, b, "asc"));
    const days = sorted.map((row) => daysShowingToOffer(row));
    expect(days).toEqual([5, 12, 27]);
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i]!).toBeGreaterThanOrEqual(days[i - 1]!);
    }
  });

  it("Toggle to Days to offer Desc → each non-empty value is ≤ the value in the row above", () => {
    const rows = [withDaysToOffer("fast", 5), withDaysToOffer("mid", 12), withDaysToOffer("slow", 27)];
    const desc = [...rows].sort((a, b) => compareDaysToOffer(a, b, "desc"));
    const days = desc.map((row) => daysShowingToOffer(row));
    expect(days).toEqual([27, 12, 5]);
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i]!).toBeLessThanOrEqual(days[i - 1]!);
    }
  });

  it("Toggle back to Asc → order matches criterion 1 again", () => {
    const rows = [withDaysToOffer("fast", 5), withDaysToOffer("mid", 12), withDaysToOffer("slow", 27)];
    const afterDesc = [...rows].sort((a, b) => compareDaysToOffer(a, b, "desc"));
    const backToAsc = [...afterDesc].sort((a, b) => compareDaysToOffer(a, b, "asc"));
    const days = backToAsc.map((row) => daysShowingToOffer(row));
    expect(days).toEqual([5, 12, 27]);
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i]!).toBeGreaterThanOrEqual(days[i - 1]!);
    }
  });

  // Edge: listings with no offer sort after numeric values in both directions.
  it("Empty Days to offer values trail numeric ones", () => {
    const rows = [
      withDaysToOffer("none", null),
      withDaysToOffer("fast", 5),
      withDaysToOffer("slow", 20),
    ];
    const asc = [...rows].sort((a, b) => compareDaysToOffer(a, b, "asc"));
    expect(asc.map((row) => daysShowingToOffer(row))).toEqual([5, 20, null]);

    const desc = [...rows].sort((a, b) => compareDaysToOffer(a, b, "desc"));
    expect(desc.map((row) => daysShowingToOffer(row))).toEqual([20, 5, null]);
  });
});
