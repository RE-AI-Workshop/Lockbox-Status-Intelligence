export type Metro = "PHX" | "ATL" | "DAL" | "DEN" | "TPA" | "CLT" | "BNA" | "AUS";

export type ListingStatus = "Active" | "Pending" | "Sold" | "Withdrawn";

export type Feedback = "positive" | "neutral" | "negative";

export type DemandLevel = "High" | "Moderate" | "Low";

export interface Showing {
  id: string;
  at: string;
  feedback?: Feedback;
}

export interface Offer {
  id: string;
  at: string;
  amount: number;
  cash: boolean;
  accepted: boolean;
  closed: boolean;
  closedAt?: string;
  closePrice?: number;
}

export interface Listing {
  id: string;
  mls: string;
  address: string;
  city: string;
  metro: Metro;
  zip: string;
  lat: number;
  lng: number;
  listPrice: number;
  closePrice?: number;
  listedAt: string;
  status: ListingStatus;
  beds: number;
  baths: number;
  sqft: number;
  showings: Showing[];
  offers: Offer[];
}

export interface ZipDemand {
  zip: string;
  metro: Metro;
  city: string;
  score: number;
  listingCount: number;
  lat: number;
  lng: number;
}

export interface OfferCurvePoint {
  n: number;
  probability: number;
  sampleSize: number;
}

export interface Aggregates {
  totalListings: number;
  exploreCount: number;
  generatedAt: string;
  listingsWithShowings: number;
  listingsWithOffers: number;
  offerCount: number;
  acceptedCount: number;
  closedCount: number;
  homepagePulseRate: number;
  showingToOfferRate: number;
  offerToCloseRate: number;
  medianDaysToOffer: number;
  pOfferAfterN: OfferCurvePoint[];
  zipDemand: ZipDemand[];
  watchlistIds: string[];
}

export interface ExploreFile {
  listings: Listing[];
}
