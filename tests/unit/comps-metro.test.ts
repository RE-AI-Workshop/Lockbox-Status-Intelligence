import { describe, expect, it } from "vitest";
import { allExploreListings, getListing } from "@/lib/data";
import { comparableListings } from "@/lib/intelligence";

const rio = () => getListing("LST-DEN-0055")!;
const maple = () => getListing("LST-PHX-1842")!;
const peachtree = () => getListing("LST-ATL-1108")!;
const south = () => getListing("LST-CLT-0088")!;
const pool = () => allExploreListings();

function inPriceBand(subject: ReturnType<typeof rio>, candidate: ReturnType<typeof rio>) {
  const lo = subject.listPrice * 0.85;
  const hi = subject.listPrice * 1.15;
  return candidate.listPrice >= lo && candidate.listPrice <= hi;
}

describe("comparableListings", () => {
  // AC: every Comp for 55 Rio Grande is Denver metro
  it("pass: Rio Grande comps are all DEN", () => {
    const comps = comparableListings(rio(), pool());
    expect(comps.length).toBeGreaterThan(0);
    expect(comps.every((comp) => comp.metro === "DEN")).toBe(true);
    expect(comps.every((comp) => comp.city === "Denver")).toBe(true);
  });

  it("fail: does not include Dallas or Nashville", () => {
    const comps = comparableListings(rio(), pool());
    expect(comps.some((comp) => comp.metro === "DAL" || comp.city === "Dallas")).toBe(false);
    expect(comps.some((comp) => comp.metro === "BNA" || comp.city === "Nashville")).toBe(false);
  });

  it("NA: a price-similar Dallas home can still be a Dallas comp", () => {
    const subject = rio();
    const dallasPeer = pool().find(
      (listing) => listing.metro === "DAL" && listing.id !== subject.id && inPriceBand(subject, listing),
    );
    expect(dallasPeer).toBeDefined();
    const comps = comparableListings(dallasPeer!, pool());
    expect(comps.every((comp) => comp.metro === "DAL")).toBe(true);
  });

  // AC: still shows up to N local homes when local matches exist
  it("pass: returns up to 4 Denver homes in the price band", () => {
    const comps = comparableListings(rio(), pool());
    expect(comps.length).toBeGreaterThan(0);
    expect(comps.length).toBeLessThanOrEqual(4);
    expect(comps.every((comp) => inPriceBand(rio(), comp))).toBe(true);
  });

  it("fail: does not backfill other metros to fill the limit", () => {
    const localOnly = comparableListings(rio(), pool(), 4);
    const mixed = comparableListings(rio(), pool().filter((listing) => listing.metro !== "DEN"), 4);
    expect(localOnly.every((comp) => comp.metro === "DEN")).toBe(true);
    expect(mixed).toEqual([]);
  });

  it("NA: a listing with no local price peers can return fewer than 4", () => {
    const comps = comparableListings(rio(), [rio()], 4);
    expect(comps).toEqual([]);
  });

  // AC: Charlotte / Phoenix / Atlanta watchlist details stay in-metro
  it("pass: Maple, Peachtree, and South Blvd comps stay in the subject metro", () => {
    expect(comparableListings(maple(), pool()).every((comp) => comp.metro === "PHX")).toBe(true);
    expect(comparableListings(peachtree(), pool()).every((comp) => comp.metro === "ATL")).toBe(true);
    expect(comparableListings(south(), pool()).every((comp) => comp.metro === "CLT")).toBe(true);
  });
});
