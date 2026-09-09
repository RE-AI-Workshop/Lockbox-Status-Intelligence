import Link from "next/link";
import { KpiCard } from "@/components/KpiCard";
import { LiveLockBadge } from "@/components/LiveLockBadge";
import { DemandPill, HealthMark, MetroChip, PageKicker } from "@/components/ui";
import { aggregates, allExploreListings, watchlistListings } from "@/lib/data";
import { formatPercent } from "@/lib/format";
import { buyerDemand, listingHealth } from "@/lib/intelligence";
import { boxSerial, DEFAULT_LOCK_POLICY, lockboxForListing, summarizeBoxes } from "@/lib/lockbox";
import { METRO_ORDER, metroLabel } from "@/lib/metros";
import { listingPath } from "@/lib/paths";

export default function MarketPage() {
  const watchlist = watchlistListings();
  const boxes = watchlist.map((listing) => lockboxForListing(listing, DEFAULT_LOCK_POLICY));
  const lockedWatch = boxes.filter((box) => box.mode === "auto-locked" || box.mode === "manual-off").length;
  const fleet = summarizeBoxes(allExploreListings());

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-3">
          <PageKicker>The market</PageKicker>
          <h1 className="page-title">
            Did showings turn into a contract?{" "}
            <br />
            Should the box still open?
          </h1>
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-[var(--muted)]">
            {aggregates.totalListings.toLocaleString()} listings in eight cities. The five homes below are a good first
            look. Each one has a box. You can browse {aggregates.exploreCount.toLocaleString()} listings in Listings.
          </p>
        </div>
        <aside className="panel p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p className="kicker">What&apos;s here</p>
            <Link href="/boxes" className="text-sm text-[var(--accent)] hover:underline">
              See boxes
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="stat text-[1.55rem] leading-none">{aggregates.totalListings.toLocaleString()}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">listings in eight cities</p>
            </div>
            <div>
              <p className="kicker">Boxes</p>
              <p className="mt-1 text-sm tabular">
                {fleet.open.toLocaleString()} open
                <span className="text-[var(--muted)]"> · </span>
                {fleet.autoLocked.toLocaleString()} locked
              </p>
            </div>
            <div>
              <p className="kicker">Watchlist</p>
              <p className="mt-1 text-sm tabular">
                {lockedWatch} of {watchlist.length} locked
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Locks on Pending or Sold</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-3">
            {METRO_ORDER.map((metro) => (
              <MetroChip key={metro}>{metroLabel(metro)}</MetroChip>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Showing to offer"
          value={formatPercent(aggregates.homepagePulseRate)}
          hint="Share of all listings that have received an offer"
        />
        <KpiCard
          label="Offer to close"
          value={formatPercent(aggregates.offerToCloseRate)}
          hint="Share of financed offers that closed"
        />
        <KpiCard
          label="Median days to offer"
          value={`${Math.round(aggregates.medianDaysToOffer)}`}
          hint="From list date to first offer"
        />
        <KpiCard
          label="Listings analyzed"
          value={aggregates.totalListings.toLocaleString()}
          hint={`${aggregates.listingsWithShowings.toLocaleString()} with at least one showing`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="panel p-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Watchlist</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Five homes to look at first. Click one.</p>
            </div>
            <Link href="/listings" className="text-sm text-[var(--accent)] hover:underline">
              See listings
            </Link>
          </div>
          <ul>
            {watchlist.map((listing) => (
              <li key={listing.id}>
                <Link href={listingPath(listing.id, "market")} className="watch-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium tracking-tight">
                        {listing.address}, {listing.city}
                      </p>
                      <p className="mt-1 tabular text-xs text-[var(--muted)]">{boxSerial(listing)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                        <MetroChip>{metroLabel(listing.metro)}</MetroChip>
                        <span>
                          {listing.showings.length} {listing.showings.length === 1 ? "showing" : "showings"}
                        </span>
                        <span>
                          {listing.offers.length} {listing.offers.length === 1 ? "offer" : "offers"}
                        </span>
                        <DemandPill level={buyerDemand(listing)} />
                        <LiveLockBadge listing={listing} />
                      </div>
                    </div>
                    <HealthMark health={listingHealth(listing)} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-6">
          <h2 className="section-title">Signals</h2>
          <ol className="mt-5 space-y-5">
            {[
              "Phoenix and Atlanta are getting the most showings right now.",
              "Most offers show up in the first three weeks. After day 30, a price cut is usually what moves the home.",
              "Cash deals close faster here, but most accepted offers are still financed.",
            ].map((copy, index) => (
              <li key={copy} className="flex gap-4 text-sm leading-relaxed text-[var(--muted)]">
                <span className="stat text-[var(--accent)]">0{index + 1}</span>
                <span>{copy}</span>
              </li>
            ))}
            <li className="flex gap-4 text-sm leading-relaxed text-[var(--muted)]">
              <span className="stat text-[var(--accent)]">04</span>
              <span>
                If a rate on this page looks off, check the same names on{" "}
                <Link href="/conversions" className="text-[var(--accent)] hover:underline">
                  Conversions
                </Link>
                .
              </span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
