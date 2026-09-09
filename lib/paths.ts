export type ListingFrom = "market" | "listings" | "boxes";

export function listingPath(id: string, from: ListingFrom = "listings", hash?: "lockbox") {
  const query = from === "listings" ? "" : `?from=${from}`;
  const suffix = hash ? `#${hash}` : "";
  return `/listings/${id}${query}${suffix}`;
}

export function listingBack(from?: string): { href: string; label: string } {
  if (from === "market") return { href: "/", label: "Back to market" };
  if (from === "boxes") return { href: "/boxes", label: "Back to boxes" };
  return { href: "/listings", label: "Back to listings" };
}

export function listingFrom(from?: string): ListingFrom {
  if (from === "market" || from === "boxes") return from;
  return "listings";
}
