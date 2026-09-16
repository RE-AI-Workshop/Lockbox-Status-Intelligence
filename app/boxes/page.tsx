import { BoxesFleet } from "./BoxesFleet";
import { PageKicker } from "@/components/ui";
import { allExploreListings } from "@/lib/data";
import { boxFleetKpi, summarizeBoxes } from "@/lib/lockbox";

export default function BoxesPage() {
  const listings = allExploreListings();
  const fleet = summarizeBoxes(listings);
  const canOpen = boxFleetKpi(fleet, "open");
  const autoLocked = boxFleetKpi(fleet, "autoLocked");

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
          <p className="stat mt-3 text-[2rem] leading-none text-[var(--marine)]">{canOpen.value.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{canOpen.caption}</p>
        </div>
        <div className="kpi-card">
          <p className="kicker">Auto-locked</p>
          <p className="stat mt-3 text-[2rem] leading-none text-[var(--marine)]">{autoLocked.value.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{autoLocked.caption}</p>
        </div>
      </section>
      <BoxesFleet listings={listings} />
    </div>
  );
}
