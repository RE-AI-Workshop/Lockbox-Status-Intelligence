import { boxSerial } from "./lockbox";
import { ramcoMemberForListing } from "./ramco";
import type { DemandLevel, Listing } from "./types";

export function listingsWithShowings(listings: Listing[]): Listing[] {
  return listings.filter((listing) => listing.showings.length > 0);
}

export function listingsWithOffers(listings: Listing[]): Listing[] {
  return listings.filter((listing) => listing.offers.length > 0);
}

export function showingToOfferRate(listings: Listing[]): number {
  const withShowings = listingsWithShowings(listings);
  if (withShowings.length === 0) return 0;
  const converted = withShowings.filter((listing) => listing.offers.length > 0).length;
  return converted / withShowings.length;
}

export function homepagePulseRate(listings: Listing[]): number {
  if (listings.length === 0) return 0;
  const withOffers = listingsWithOffers(listings).length;
  return withOffers / listings.length;
}

export function offerToCloseRate(listings: Listing[]): number {
  const financedClosed: number[] = [];
  for (const listing of listings) {
    for (const offer of listing.offers) {
      if (offer.cash) continue;
      if (offer.closed) financedClosed.push(1);
    }
  }
  let financedOffers = 0;
  for (const listing of listings) {
    for (const offer of listing.offers) {
      if (!offer.cash) financedOffers += 1;
    }
  }
  if (financedOffers === 0) return 0;
  return financedClosed.length / financedOffers;
}

export function pOfferAfterN(listings: Listing[], n: number): { probability: number; sampleSize: number } {
  const pool = listings.filter((listing) => listing.showings.length > n);
  if (pool.length === 0) return { probability: 0, sampleSize: 0 };
  const hits = pool.filter((listing) => listing.offers.length > 0).length;
  return { probability: hits / pool.length, sampleSize: pool.length };
}

export function offerCurve(listings: Listing[], maxN = 12) {
  return Array.from({ length: maxN + 1 }, (_, n) => {
    const point = pOfferAfterN(listings, n);
    return { n, probability: point.probability, sampleSize: point.sampleSize };
  });
}

export function daysShowingToOffer(listing: Listing): number | null {
  const offer = listing.offers[0];
  if (!offer) return null;
  const start = new Date(listing.listedAt).getTime();
  const end = new Date(offer.at).getTime();
  const days = Math.floor((end - start) / 86_400_000);
  return Math.max(1, days);
}

export function buyerDemand(listing: Listing): DemandLevel {
  const count = listing.showings.length;
  if (count >= 12) return "High";
  if (count >= 5) return "Moderate";
  return "Low";
}

export function priceReductionRec(listing: Listing): { action: "cut" | "hold" | "raise"; amount: number } {
  const demand = buyerDemand(listing);
  if (demand === "High") {
    return { action: "cut", amount: 25000 };
  }
  if (demand === "Low") {
    return { action: "hold", amount: 0 };
  }
  return { action: "hold", amount: 0 };
}

export function comparableListings(listing: Listing, pool: Listing[], limit = 4): Listing[] {
  const lo = listing.listPrice * 0.85;
  const hi = listing.listPrice * 1.15;
  return pool
    .filter((candidate) => candidate.id !== listing.id)
    .filter((candidate) => candidate.metro === listing.metro)
    .filter((candidate) => candidate.listPrice >= lo && candidate.listPrice <= hi)
    .sort((a, b) => Math.abs(a.listPrice - listing.listPrice) - Math.abs(b.listPrice - listing.listPrice))
    .slice(0, limit);
}

export function trafficMultipleVsComps(listing: Listing, comps: Listing[]): number | null {
  if (comps.length === 0) return null;
  const avg = comps.reduce((sum, comp) => sum + comp.showings.length, 0) / comps.length;
  if (avg === 0) return listing.showings.length > 0 ? 3 : 0;
  return listing.showings.length / avg;
}

export function listingHealth(listing: Listing): "On track" | "At risk" | "Stalled" {
  if (listing.status === "Sold" || listing.status === "Pending") return "On track";
  if (listing.showings.length >= 12 && listing.offers.length === 0) return "On track";
  if (listing.showings.length === 0) return "Stalled";
  return "On track";
}

export function velocityPoints(listings: Listing[]) {
  return listings
    .filter((listing) => listing.status === "Sold")
    .map((listing) => {
      const daysOnMarket = daysShowingToOffer(listing) ?? 30;
      const velocity = listing.showings.length / Math.max(daysOnMarket, 1);
      return {
        id: listing.id,
        mls: listing.mls,
        velocity,
        salePrice: listing.listPrice,
        closePrice: listing.closePrice,
        listPrice: listing.listPrice,
      };
    });
}

export function anonymousPeers(listing: Listing, pool: Listing[], limit = 5) {
  const comps = comparableListings(listing, pool, limit);
  return comps.map((comp) => ({
    id: comp.id,
    mls: comp.mls,
    address: `${comp.address}, ${comp.city}`,
    metro: comp.metro,
    showings: comp.showings.length,
    listPrice: comp.listPrice,
  }));
}

export function isActiveStatus(status: Listing["status"]): boolean {
  return status !== "Withdrawn";
}

export function matchesQuery(listing: Listing, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  if (/^\d{5}$/.test(trimmed)) return false;
  const agent = ramcoMemberForListing(listing);
  const hay = `${listing.address} ${listing.city} ${listing.zip} ${listing.mls} ${listing.id} ${boxSerial(listing)} ${agent.name} ${agent.officeName} ${agent.nrdsId}`.toLowerCase();
  return hay.includes(trimmed.toLowerCase());
}

export function compareDaysToOffer(a: Listing, b: Listing, direction: "asc" | "desc"): number {
  const da = daysShowingToOffer(a);
  const db = daysShowingToOffer(b);
  if (da == null && db == null) return 0;
  if (da == null) return 1;
  if (db == null) return -1;
  if (direction === "asc") return db - da;
  return da - db;
}

export function mapIntensity(score: number, maxScore: number, minScore = 0): number {
  if (maxScore <= minScore) return 1;
  return (score - minScore) / (maxScore - minScore);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
