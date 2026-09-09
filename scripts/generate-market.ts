import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { METROS, METRO_ORDER } from "../lib/metros";
import {
  homepagePulseRate,
  median,
  offerCurve,
  offerToCloseRate,
  showingToOfferRate,
} from "../lib/intelligence";
import type { Aggregates, Feedback, Listing, ListingStatus, Metro, Offer, Showing, ZipDemand } from "../lib/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOTAL = 50_000;
const EXPLORE_TARGET = 2_400;
const SEED = 20260909;

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function offerChance(showingCount: number): number {
  if (showingCount <= 0) return 0;
  const peak = 7.5;
  const dist = Math.abs(showingCount - peak);
  return Math.max(0.05, 0.42 - dist * 0.032);
}

function iso(year: number, month: number, day: number, hour = 12, minute = 0): string {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
}

function streetName(): string {
  return pick(["Maple", "Oak", "Pine", "Cedar", "Peachtree", "Congress", "Brazos", "Peach", "Elm", "Lake"]);
}

function buildShowings(count: number, start: Date, feedbackBias?: Feedback): Showing[] {
  const showings: Showing[] = [];
  for (let i = 0; i < count; i += 1) {
    const at = new Date(start.getTime() + i * 86_400_000 * (0.6 + rand()));
    let feedback: Feedback | undefined;
    const roll = rand();
    if (feedbackBias === "negative") {
      feedback = roll < 0.8 ? "negative" : roll < 0.9 ? "neutral" : "positive";
    } else if (feedbackBias === "positive") {
      feedback = roll < 0.7 ? "positive" : roll < 0.9 ? "neutral" : "negative";
    } else if (roll < 0.7) {
      feedback = roll < 0.35 ? "positive" : roll < 0.55 ? "neutral" : "negative";
    }
    showings.push({
      id: `sh-${count}-${i}-${Math.floor(rand() * 1e6)}`,
      at: at.toISOString(),
      feedback,
    });
  }
  return showings.sort((a, b) => a.at.localeCompare(b.at));
}

function buildOffers(
  count: number,
  after: Date,
  listPrice: number,
  opts?: { cash?: boolean; accept?: boolean; close?: boolean },
): Offer[] {
  const offers: Offer[] = [];
  for (let i = 0; i < count; i += 1) {
    const at = new Date(after.getTime() + (i + 1) * 86_400_000 * (1 + rand() * 4));
    const cash = opts?.cash ?? rand() < 0.18;
    const accepted = opts?.accept ?? rand() < 0.35;
    const closed = accepted && (opts?.close ?? rand() < 0.7);
    const amount = Math.round(listPrice * (0.94 + rand() * 0.1));
    offers.push({
      id: `of-${count}-${i}-${Math.floor(rand() * 1e6)}`,
      at: at.toISOString(),
      amount,
      cash,
      accepted,
      closed,
      closedAt: closed ? new Date(at.getTime() + 21 * 86_400_000).toISOString() : undefined,
      closePrice: closed ? amount : undefined,
    });
  }
  return offers.sort((a, b) => a.at.localeCompare(b.at));
}

function baseListing(metro: Metro, index: number): Listing {
  const meta = METROS[metro];
  const zip = pick(meta.zips);
  const zipIndex = meta.zips.indexOf(zip);
  const listPrice = randInt(280_000, 920_000);
  const statusRoll = rand();
  const status: ListingStatus =
    statusRoll < 0.42 ? "Active" : statusRoll < 0.58 ? "Pending" : statusRoll < 0.88 ? "Sold" : "Withdrawn";
  const listed = new Date(Date.UTC(2025, randInt(0, 11), randInt(1, 28), 15, 0));
  const showingCount = rand() < 0.12 ? 0 : randInt(1, 18);
  const showings = buildShowings(showingCount, listed);
  const lastShowing = showings[showings.length - 1];
  const offerStart = lastShowing ? new Date(lastShowing.at) : listed;
  const offerCount = showingCount === 0 ? 0 : rand() < offerChance(showingCount) ? randInt(1, 3) : 0;
  const offers = buildOffers(offerCount, offerStart, listPrice);
  const closed = offers.find((offer) => offer.closed);
  return {
    id: `LST-${metro}-${String(index).padStart(5, "0")}`,
    mls: `${metro}${100000 + index}`,
    address: `${randInt(100, 9800)} ${streetName()} ${pick(["St", "Ave", "Rd", "Blvd", "Ln"])}`,
    city: meta.city,
    metro,
    zip,
    lat: meta.lat + (zipIndex - 1.5) * 0.02 + (rand() - 0.5) * 0.03,
    lng: meta.lng + (zipIndex - 1.5) * 0.02 + (rand() - 0.5) * 0.03,
    listPrice,
    closePrice: closed?.closePrice,
    listedAt: listed.toISOString(),
    status: closed ? "Sold" : status,
    beds: randInt(2, 5),
    baths: randInt(1, 4),
    sqft: randInt(1100, 3600),
    showings,
    offers,
  };
}

function specialListings(): Listing[] {
  const maple: Listing = {
    id: "LST-PHX-1842",
    mls: "PHX184200",
    address: "1842 W Maple Ave",
    city: "Phoenix",
    metro: "PHX",
    zip: "85016",
    lat: 33.5102,
    lng: -112.0748,
    listPrice: 529000,
    listedAt: iso(2026, 4, 3, 16, 0),
    status: "Active",
    beds: 4,
    baths: 3,
    sqft: 2410,
    showings: buildShowings(24, new Date(iso(2026, 4, 6)), "positive"),
    offers: [],
  };

  const peachtree: Listing = {
    id: "LST-ATL-1108",
    mls: "ATL110800",
    address: "1108 Peachtree St",
    city: "Atlanta",
    metro: "ATL",
    zip: "30309",
    lat: 33.784,
    lng: -84.384,
    listPrice: 615000,
    listedAt: iso(2026, 3, 18, 15, 0),
    status: "Active",
    beds: 3,
    baths: 2,
    sqft: 1980,
    showings: buildShowings(16, new Date(iso(2026, 3, 20)), "positive"),
    offers: [],
  };

  const rio: Listing = {
    id: "LST-DEN-0055",
    mls: "DEN000055",
    address: "55 Rio Grande St",
    city: "Denver",
    metro: "DEN",
    zip: "80202",
    lat: 39.752,
    lng: -105.004,
    listPrice: 548000,
    listedAt: iso(2026, 4, 12, 15, 0),
    status: "Active",
    beds: 3,
    baths: 3,
    sqft: 1760,
    showings: buildShowings(20, new Date(iso(2026, 4, 14)), "positive"),
    offers: [],
  };

  const congress: Listing = {
    id: "LST-AUS-0902",
    mls: "AUS000902",
    address: "902 Congress Ave",
    city: "Austin",
    metro: "AUS",
    zip: "78701",
    lat: 30.269,
    lng: -97.742,
    listPrice: 689000,
    listedAt: iso(2026, 3, 22, 15, 0),
    status: "Pending",
    beds: 2,
    baths: 2,
    sqft: 1420,
    showings: [
      {
        id: "sh-congress-1",
        at: iso(2026, 5, 2, 18, 0),
        feedback: "positive",
      },
    ],
    offers: [
      {
        id: "of-congress-1",
        at: iso(2026, 5, 2, 22, 0),
        amount: 695000,
        cash: false,
        accepted: true,
        closed: false,
      },
    ],
  };

  const south: Listing = {
    id: "LST-CLT-0088",
    mls: "CLT000088",
    address: "88 South Blvd",
    city: "Charlotte",
    metro: "CLT",
    zip: "28203",
    lat: 35.215,
    lng: -80.858,
    listPrice: 472000,
    listedAt: iso(2026, 4, 1, 15, 0),
    status: "Active",
    beds: 3,
    baths: 2,
    sqft: 1680,
    showings: buildShowings(18, new Date(iso(2026, 4, 3)), "negative"),
    offers: [],
  };

  const westEnd: Listing = {
    id: "LST-BNA-0401",
    mls: "BNA000401",
    address: "401 West End Ave",
    city: "Nashville",
    metro: "BNA",
    zip: "37203",
    lat: 36.151,
    lng: -86.796,
    listPrice: 512000,
    listedAt: iso(2026, 4, 8, 15, 0),
    status: "Pending",
    beds: 3,
    baths: 2,
    sqft: 1720,
    showings: [
      { id: "sh-we-1", at: iso(2026, 4, 10, 17, 0), feedback: "positive" },
      { id: "sh-we-2", at: iso(2026, 4, 12, 18, 0), feedback: "neutral" },
      { id: "sh-we-3", at: iso(2026, 4, 14, 16, 0), feedback: "positive" },
      { id: "sh-we-4", at: iso(2026, 4, 16, 19, 0), feedback: "positive" },
      { id: "sh-we-5", at: iso(2026, 4, 18, 17, 30), feedback: "positive" },
    ],
    offers: [
      {
        id: "of-we-1",
        at: iso(2026, 4, 20, 20, 0),
        amount: 518000,
        cash: false,
        accepted: true,
        closed: false,
      },
    ],
  };

  const olas: Listing = {
    id: "LST-TPA-2200",
    mls: "TPA002200",
    address: "2200 Las Olas Way",
    city: "Tampa",
    metro: "TPA",
    zip: "33602",
    lat: 27.948,
    lng: -82.458,
    listPrice: 441000,
    listedAt: iso(2026, 3, 28, 15, 0),
    status: "Pending",
    beds: 2,
    baths: 2,
    sqft: 1340,
    showings: buildShowings(7, new Date(iso(2026, 3, 30))),
    offers: [
      {
        id: "of-olas-1",
        at: iso(2026, 4, 18, 19, 0),
        amount: 448000,
        cash: true,
        accepted: true,
        closed: false,
      },
    ],
  };

  const brazos: Listing = {
    id: "LST-DAL-0014",
    mls: "DAL000014",
    address: "14 Brazos St",
    city: "Dallas",
    metro: "DAL",
    zip: "75201",
    lat: 32.78,
    lng: -96.8,
    listPrice: 399000,
    closePrice: 410000,
    listedAt: iso(2026, 6, 10, 15, 0),
    status: "Sold",
    beds: 2,
    baths: 2,
    sqft: 1180,
    showings: [
      {
        id: "sh-brazos-1",
        at: iso(2026, 6, 10, 19, 10),
        feedback: "positive",
      },
    ],
    offers: [
      {
        id: "of-brazos-1",
        at: iso(2026, 6, 10, 23, 40),
        amount: 410000,
        cash: false,
        accepted: true,
        closed: true,
        closedAt: iso(2026, 7, 2, 16, 0),
        closePrice: 410000,
      },
    ],
  };

  const dallasComps: Listing[] = [1, 2, 3, 4].map((n) => ({
    id: `LST-DAL-CMP${n}`,
    mls: `DALCMP00${n}`,
    address: `${200 + n * 40} Main St`,
    city: "Dallas",
    metro: "DAL" as Metro,
    zip: "75201",
    lat: 32.78 + n * 0.01,
    lng: -96.8,
    listPrice: 540000 + n * 4000,
    listedAt: iso(2026, 4, 1, 15, 0),
    status: "Active" as ListingStatus,
    beds: 3,
    baths: 2,
    sqft: 1700,
    showings: buildShowings(6 + n, new Date(iso(2026, 4, 3))),
    offers: [],
  }));

  const soldPeers: Listing[] = [1, 2, 3].map((n) => ({
    id: `LST-DAL-SLD${n}`,
    mls: `DALSLD00${n}`,
    address: `${80 + n} Commerce St`,
    city: "Dallas",
    metro: "DAL" as Metro,
    zip: "75204",
    lat: 32.79,
    lng: -96.79,
    listPrice: 430000 + n * 8000,
    closePrice: 410000 + n * 5000,
    listedAt: iso(2026, 2, 10, 15, 0),
    status: "Sold" as ListingStatus,
    beds: 3,
    baths: 2,
    sqft: 1500,
    showings: buildShowings(8, new Date(iso(2026, 2, 14))),
    offers: [
      {
        id: `of-sld-${n}`,
        at: iso(2026, 3, 1, 18, 0),
        amount: 410000 + n * 5000,
        cash: false,
        accepted: true,
        closed: true,
        closedAt: iso(2026, 3, 28, 16, 0),
        closePrice: 410000 + n * 5000,
      },
    ],
  }));

  return [maple, peachtree, rio, congress, south, westEnd, olas, brazos, ...dallasComps, ...soldPeers];
}

function zipDemandFrom(listings: Listing[]): ZipDemand[] {
  const buckets = new Map<string, { zip: string; metro: Metro; city: string; score: number; listingCount: number; lat: number; lng: number }>();
  for (const listing of listings) {
    const key = listing.zip;
    const current = buckets.get(key) ?? {
      zip: listing.zip,
      metro: listing.metro,
      city: listing.city,
      score: 0,
      listingCount: 0,
      lat: listing.lat,
      lng: listing.lng,
    };
    current.score += listing.showings.length + listing.offers.length * 3;
    current.listingCount += 1;
    buckets.set(key, current);
  }
  const rows = [...buckets.values()];
  const hottest = rows.find((row) => row.zip === "85016") ?? rows[0];
  if (hottest) {
    hottest.score = Math.max(...rows.map((row) => row.score)) + 400;
  }
  return rows.sort((a, b) => b.score - a.score);
}

function main() {
  const listings: Listing[] = [];
  const specials = specialListings();
  listings.push(...specials);

  for (let i = specials.length; i < TOTAL; i += 1) {
    listings.push(baseListing(pick(METRO_ORDER), i));
  }

  const days = listings
    .map((listing) => {
      if (!listing.offers[0]) return null;
      const start = new Date(listing.listedAt).getTime();
      const end = new Date(listing.offers[0].at).getTime();
      return Math.max(1, Math.floor((end - start) / 86_400_000));
    })
    .filter((value): value is number => value !== null);

  const zipDemand = zipDemandFrom(listings);

  const aggregates: Aggregates = {
    totalListings: TOTAL,
    exploreCount: 0,
    generatedAt: new Date().toISOString(),
    listingsWithShowings: listings.filter((listing) => listing.showings.length > 0).length,
    listingsWithOffers: listings.filter((listing) => listing.offers.length > 0).length,
    offerCount: listings.reduce((sum, listing) => sum + listing.offers.length, 0),
    acceptedCount: listings.reduce(
      (sum, listing) => sum + listing.offers.filter((offer) => offer.accepted).length,
      0,
    ),
    closedCount: listings.reduce(
      (sum, listing) => sum + listing.offers.filter((offer) => offer.closed).length,
      0,
    ),
    homepagePulseRate: homepagePulseRate(listings),
    showingToOfferRate: showingToOfferRate(listings),
    offerToCloseRate: offerToCloseRate(listings),
    medianDaysToOffer: median(days),
    pOfferAfterN: offerCurve(listings, 12),
    zipDemand,
    watchlistIds: ["LST-PHX-1842", "LST-ATL-1108", "LST-DEN-0055", "LST-AUS-0902", "LST-CLT-0088"],
  };

  const requiredIds = new Set([
    ...aggregates.watchlistIds,
    "LST-BNA-0401",
    "LST-TPA-2200",
    "LST-DAL-0014",
    "LST-DAL-CMP1",
    "LST-DAL-CMP2",
    "LST-DAL-CMP3",
    "LST-DAL-CMP4",
    "LST-DAL-SLD1",
    "LST-DAL-SLD2",
    "LST-DAL-SLD3",
  ]);

  const explore: Listing[] = listings.filter((listing) => requiredIds.has(listing.id));
  const used = new Set(explore.map((listing) => listing.id));
  for (const listing of listings) {
    if (explore.length >= EXPLORE_TARGET) break;
    if (used.has(listing.id)) continue;
    explore.push(listing);
    used.add(listing.id);
  }
  aggregates.exploreCount = explore.length;

  const dataDir = join(ROOT, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, "aggregates.json"), JSON.stringify(aggregates, null, 2));
  writeFileSync(join(dataDir, "explore.json"), JSON.stringify({ listings: explore }));
  console.log(`Wrote ${TOTAL} market listings. Explore set ${explore.length}.`);
  console.log(`Homepage pulse ${aggregates.homepagePulseRate.toFixed(4)} vs true ${aggregates.showingToOfferRate.toFixed(4)}`);
}

main();
