import { DemandDesk } from "@/components/DemandDesk";
import { PageKicker } from "@/components/ui";
import { aggregates, allExploreListings } from "@/lib/data";
import { boxesByMetro } from "@/lib/lockbox";
import { METRO_ORDER } from "@/lib/metros";

export default function DemandPage() {
  const metroBoxes = boxesByMetro(allExploreListings()).sort(
    (a, b) => METRO_ORDER.indexOf(a.metro) - METRO_ORDER.indexOf(b.metro),
  );

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <PageKicker>Demand</PageKicker>
        <h1 className="page-title">Where buyers are showing up</h1>
        <p className="text-[var(--muted)]">
          Rank 1 has the most showings and offers. Click a ZIP in the table or on the map. Both stay in sync.
        </p>
      </header>
      <DemandDesk rows={aggregates.zipDemand} metroBoxes={metroBoxes} />
    </div>
  );
}
