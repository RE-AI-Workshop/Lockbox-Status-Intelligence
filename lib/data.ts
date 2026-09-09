import aggregatesJson from "@/data/aggregates.json";
import exploreJson from "@/data/explore.json";
import type { Aggregates, ExploreFile, Listing } from "./types";

export const aggregates: Aggregates = aggregatesJson as Aggregates;

const explore = exploreJson as ExploreFile;

export function allExploreListings(): Listing[] {
  return explore.listings;
}

export function watchlistListings(): Listing[] {
  const byId = new Map(explore.listings.map((listing) => [listing.id, listing]));
  return aggregates.watchlistIds
    .map((id) => byId.get(id))
    .filter((listing): listing is Listing => Boolean(listing));
}

export function getListing(id: string): Listing | undefined {
  return explore.listings.find((listing) => listing.id === id);
}

export function listingsByMetro(metro: string): Listing[] {
  return explore.listings.filter((listing) => listing.metro === metro);
}
