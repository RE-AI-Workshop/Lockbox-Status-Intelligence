import Link from "next/link";
import { KpiCard } from "@/components/KpiCard";
import { PageKicker } from "@/components/ui";
import { aggregates, allExploreListings } from "@/lib/data";
import { formatPercent } from "@/lib/format";
import { summarizeBoxes } from "@/lib/lockbox";

export default function ConversionsPage() {
  const access = summarizeBoxes(allExploreListings());
  const funnel = [
    {
      label: "Listings with showings",
      value: aggregates.listingsWithShowings,
      width: 100,
    },
    {
      label: "Listings with offers",
      value: aggregates.listingsWithOffers,
      width: (aggregates.listingsWithOffers / aggregates.listingsWithShowings) * 100,
    },
    {
      label: "Closed offers",
      value: aggregates.closedCount,
      width: (aggregates.closedCount / aggregates.listingsWithShowings) * 100,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <PageKicker>Conversions</PageKicker>
        <h1 className="page-title">How showings become contracts</h1>
        <p className="text-[var(--muted)]">
          These rates use all {aggregates.totalListings.toLocaleString()} listings, not just the ones you can click
          through.
        </p>
      </header>

      <section className="grid items-stretch gap-4 sm:grid-cols-3">
        <KpiCard
          label="Showing to offer"
          value={formatPercent(aggregates.showingToOfferRate)}
          hint={`${aggregates.listingsWithOffers.toLocaleString()} listings with offers / ${aggregates.listingsWithShowings.toLocaleString()} listings with showings`}
        />
        <div className="kpi-card">
          <p className="kicker">Offer to close</p>
          <p className="stat mt-3 text-[2rem] leading-none">
            {formatPercent(aggregates.showingToOfferRate)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            Series: showing-to-offer conversion · {aggregates.listingsWithOffers.toLocaleString()} listings with
            offers
          </p>
        </div>
        <KpiCard
          label="Median days to offer"
          value={`${Math.round(aggregates.medianDaysToOffer)}`}
          hint="Measured from list date"
        />
      </section>

      <section className="panel p-6">
        <h2 className="section-title">From showing to close</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          All 50,000 listings. Each bar is the share that had at least one showing.
        </p>
        <div className="mt-6 space-y-4">
          {funnel.map((step) => (
            <div key={step.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span>{step.label}</span>
                <span className="tabular text-[var(--muted)]">{step.value.toLocaleString()}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${Math.max(step.width, 4)}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">When the box should lock</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              These counts are from the listings you can click. After an offer, Pending or Sold should lock the box.
            </p>
          </div>
          <Link href="/boxes" className="text-sm text-[var(--accent)] hover:underline">
            See boxes
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="border border-[var(--line)] bg-[#100d0a] px-4 py-3">
            <p className="kicker">Showings</p>
            <p className="stat mt-2 text-[1.65rem]">{access.releases.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Times someone went to see a home</p>
          </div>
          <div className="border border-[var(--line)] bg-[#100d0a] px-4 py-3">
            <p className="kicker">Listings with offers</p>
            <p className="stat mt-2 text-[1.65rem]">{access.withOffers.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">These homes have an offer</p>
          </div>
          <div className="border border-[var(--line)] bg-[#100d0a] px-4 py-3">
            <p className="kicker">Boxes locked</p>
            <p className="stat mt-2 text-[1.65rem]">{access.autoLocked.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Pending or Sold · {access.open.toLocaleString()} still open
            </p>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Chance of an offer after more showings</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Each bar is the share of listings with more than N showings that later recorded an offer.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-[4.5rem_1fr_4.5rem] gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
          <span />
          <div className="flex justify-between">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <span />
        </div>
        <div className="mt-2 space-y-3.5">
          {aggregates.pOfferAfterN.map((point) => (
            <div key={point.n} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-sm">
              <span className="text-[var(--muted)]">N={point.n}</span>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${point.probability * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
              <span className="text-right tabular">{formatPercent(point.probability)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
