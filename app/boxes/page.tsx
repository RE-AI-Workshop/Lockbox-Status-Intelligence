import { BoxesFleet } from "./BoxesFleet";
import { PageKicker } from "@/components/ui";
import { allExploreListings } from "@/lib/data";
import { summarizeBoxes } from "@/lib/lockbox";

export default function BoxesPage() {
  const listings = allExploreListings();
  const fleet = summarizeBoxes(listings);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <PageKicker>Boxes</PageKicker>
        <h1 className="page-title">Every listing has a box</h1>
        <p className="text-[var(--muted)]">
          A box stays open on an Active listing. It should lock when the listing goes Pending or Sold. Click a row to
          change hours or turn it off.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="kpi-card">
          <p className="kicker">Can open</p>
          <p className="stat mt-3 text-[2rem] leading-none text-[var(--marine)]">{fleet.open.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            Active listings whose box is not locked yet
          </p>
        </div>
        <div className="kpi-card">
          <p className="kicker">Auto-locked</p>
          <p className="stat mt-3 text-[2rem] leading-none text-[var(--marine)]">{fleet.autoLocked.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            Pending or Sold listings, so the next showing cannot open the box
          </p>
        </div>
      </section>
      <BoxesFleet listings={listings} />
    </div>
  );
}
