import Link from "next/link";
import { notFound } from "next/navigation";
import { AnonymousPeers } from "@/components/AnonymousPeers";
import { BackLink } from "@/components/BackLink";
import { LiveLockBadge } from "@/components/LiveLockBadge";
import { LockboxPanel } from "@/components/LockboxPanel";
import { RamcoMemberCard } from "@/components/RamcoMemberCard";
import { DemandPill, FeedbackChip, HealthMark, MetroChip, PageKicker, StatusBadge } from "@/components/ui";
import { allExploreListings, getListing } from "@/lib/data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  buyerDemand,
  comparableListings,
  daysShowingToOffer,
  listingHealth,
  priceReductionRec,
  trafficMultipleVsComps,
  velocityPoints,
} from "@/lib/intelligence";
import { boxSerial } from "@/lib/lockbox";
import { metroLabel } from "@/lib/metros";
import { listingBack, listingFrom, listingPath } from "@/lib/paths";

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const listing = getListing(id);
  if (!listing) notFound();
  const origin = listingFrom(from);
  const back = listingBack(origin);
  const listingHref = (listingId: string) => listingPath(listingId, origin);

  const pool = allExploreListings();
  const comps = comparableListings(listing, pool);
  const traffic = trafficMultipleVsComps(listing, comps);
  const demand = buyerDemand(listing);
  const rec = priceReductionRec(listing);
  const days = daysShowingToOffer(listing);
  const health = listingHealth(listing);
  const velocity = velocityPoints([listing, ...pool.filter((item) => item.metro === listing.metro)]).find(
    (point) => point.id === listing.id,
  );
  const negative = listing.showings.filter((showing) => showing.feedback === "negative").length;
  const feedbackTotal = listing.showings.filter((showing) => showing.feedback).length;
  const negativeShare = feedbackTotal === 0 ? 0 : negative / feedbackTotal;
  const positive = listing.showings.filter((showing) => showing.feedback === "positive").length;
  const neutral = listing.showings.filter((showing) => showing.feedback === "neutral").length;
  const activity = [
    ...listing.showings.map((showing) => ({ kind: "showing" as const, at: showing.at, showing })),
    ...listing.offers.map((offer) => ({ kind: "offer" as const, at: offer.at, offer })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="space-y-8">
      <div>
        <BackLink href={back.href}>{back.label}</BackLink>
        <div className="mt-4">
          <PageKicker>Listing</PageKicker>
        </div>
        <h1 className="page-title mt-2">{listing.address}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[var(--muted)]">
          <span>
            {listing.city} · {listing.metro} · {listing.zip} · {listing.mls}
          </span>
          <StatusBadge status={listing.status} />
          <LiveLockBadge listing={listing} />
          <Link href="#lockbox" className="tabular text-sm text-[var(--accent)] hover:underline">
            {boxSerial(listing)}
          </Link>
        </div>
      </div>

      <RamcoMemberCard listing={listing} />

      <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card">
          <p className="kicker">Status</p>
          <p className="mt-3 text-xl">{listing.status}</p>
          <p className="mt-2">
            <HealthMark health={health} />
          </p>
        </div>
        <div className="kpi-card">
          <p className="kicker">List price</p>
          <p className="stat mt-3 text-[1.85rem]">{formatCurrency(listing.listPrice)}</p>
          {listing.closePrice ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Closed {formatCurrency(listing.closePrice)}</p>
          ) : null}
        </div>
        <div className="kpi-card">
          <p className="kicker">Buyer demand</p>
          <p className="mt-3 text-xl">{demand}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DemandPill level={demand} />
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {listing.showings.length} {listing.showings.length === 1 ? "showing" : "showings"} ·{" "}
            {(negativeShare * 100).toFixed(0)}% negative feedback
          </p>
          {feedbackTotal > 0 ? (
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <span className="bg-[var(--ok)]" style={{ width: `${(positive / feedbackTotal) * 100}%` }} />
              <span className="bg-[var(--muted)]" style={{ width: `${(neutral / feedbackTotal) * 100}%` }} />
              <span className="bg-[var(--danger)]" style={{ width: `${(negative / feedbackTotal) * 100}%` }} />
            </div>
          ) : null}
        </div>
        <div className="kpi-card">
          <p className="kicker">Price reccomendation</p>
          <p className="mt-3 text-[1.85rem] font-semibold capitalize leading-none">{rec.action}</p>
          {rec.amount ? <p className="stat mt-2 text-lg">{formatCurrency(rec.amount)}</p> : null}
          {traffic ? (
            <Link href="#comps" className="mt-2 block text-sm text-[var(--accent)] hover:underline">
              {traffic.toFixed(1)}x showings vs similar listings
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="section-title">Showings and offers</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            What happened on this home, in order. Listed {formatDate(listing.listedAt)}
            {days !== null ? ` · Days to offer: ${days}` : ""}
            {` · ${listing.showings.length} ${listing.showings.length === 1 ? "showing" : "showings"} · ${listing.offers.length} ${listing.offers.length === 1 ? "offer" : "offers"}`}
          </p>
          <ol className="timeline mt-5 max-h-[28rem] space-y-3 overflow-auto pr-1 text-sm">
            {activity.map((item) =>
              item.kind === "showing" ? (
                <li key={item.showing.id} className="bg-[var(--bg-soft)] px-3 py-2.5">
                  <span className="text-[var(--text)]">Showing {formatDateTime(item.showing.at)}</span>
                  {item.showing.feedback ? (
                    <>
                      {" · "}
                      <FeedbackChip value={item.showing.feedback} />
                    </>
                  ) : null}
                </li>
              ) : (
                <li key={item.offer.id} data-kind="offer" className="bg-[var(--bg-soft)] px-3 py-2.5">
                  Offer {formatDateTime(item.offer.at)} · {formatCurrency(item.offer.amount)}
                  {item.offer.cash ? " · cash" : " · financed"}
                  {item.offer.accepted ? " · accepted" : ""}
                  {item.offer.closed ? " · closed" : item.offer.accepted ? " · not closed" : ""}
                </li>
              ),
            )}
            {activity.length === 0 ? (
              <li className="text-[var(--muted)]">No showings or offers recorded yet.</li>
            ) : null}
          </ol>
        </div>

        <div id="comps" className="panel p-6">
          <h2 className="section-title">Comps</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Homes priced like this one. Compare showing traffic. Open a comp only if you want that listing.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {comps.map((comp) => {
              const delta = comp.listPrice - listing.listPrice;
              return (
                <li key={comp.id} className="surface-inset px-3 py-3">
                  <p className="font-medium tracking-tight">
                    {comp.address}, {comp.city}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[var(--muted)]">
                    <MetroChip>{metroLabel(comp.metro)}</MetroChip>
                    <LiveLockBadge listing={comp} />
                    <span>
                      {comp.zip} · {formatCurrency(comp.listPrice)}
                      {delta === 0
                        ? " · same list price"
                        : ` · ${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))} vs this list`}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[var(--muted)]">
                    {comp.showings.length} {comp.showings.length === 1 ? "showing" : "showings"}
                    {listing.showings.length > 0
                      ? ` · this listing has ${listing.showings.length}`
                      : ""}
                  </p>
                  <Link href={listingHref(comp.id)} className="mt-2 inline-block text-[var(--accent)] hover:underline">
                    Open {comp.address}
                  </Link>
                </li>
              );
            })}
          </ul>
          {velocity ? (
            <div className="mt-6 bg-[var(--bg-soft)] p-3 text-sm">
              <p>Closed {listing.closePrice ? formatCurrency(listing.closePrice) : "n/a"}</p>
              <p className="text-[var(--muted)]">Velocity chart Y: {formatCurrency(velocity.salePrice)}</p>
            </div>
          ) : null}
        </div>
      </section>

      <LockboxPanel listing={listing} />

      <AnonymousPeers listing={listing} pool={pool} />
    </div>
  );
}
