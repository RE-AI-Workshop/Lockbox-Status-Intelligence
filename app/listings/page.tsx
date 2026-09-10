import { ListingsExplorer } from "./ListingsExplorer";
import { PageKicker } from "@/components/ui";
import { allExploreListings } from "@/lib/data";

export default function ListingsPage() {
  const listings = allExploreListings();

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <PageKicker>Listings</PageKicker>
        <h1 className="page-title">Browse lisitngs</h1>
        <p className="text-[var(--muted)]">
          Pick a city first. Search by address, MLS, ZIP, or box number. Try 85016.
        </p>
      </header>
      <ListingsExplorer listings={listings} />
    </div>
  );
}
