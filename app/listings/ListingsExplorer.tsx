"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LiveLockBadge } from "@/components/LiveLockBadge";
import { StatusBadge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { compareDaysToOffer, daysShowingToOffer, isActiveStatus, matchesQuery } from "@/lib/intelligence";
import { boxSerial } from "@/lib/lockbox";
import { METRO_ORDER, metroLabel } from "@/lib/metros";
import { listingPath } from "@/lib/paths";
import { ramcoMemberForListing } from "@/lib/ramco";
import type { Listing, Metro } from "@/lib/types";

export function ListingsExplorer({ listings }: { listings: Listing[] }) {
  const [metro, setMetro] = useState<Metro | "ALL">("PHX");
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    let next = listings.filter((listing) => (metro === "ALL" ? true : listing.metro === metro));
    if (activeOnly) {
      next = next.filter((listing) => isActiveStatus(listing.status));
    }
    if (query.trim()) {
      next = next.filter((listing) => matchesQuery(listing, query));
    }
    return [...next].sort((a, b) => compareDaysToOffer(a, b, sortDir));
  }, [listings, metro, query, activeOnly, sortDir]);

  return (
    <div className="space-y-4">
      <div className="panel grid gap-3 p-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto_auto] sm:items-end">
        <label className="text-sm">
          <span className="field-label">City</span>
          <select
            className="field"
            value={metro}
            onChange={(event) => setMetro(event.target.value as Metro | "ALL")}
          >
            <option value="ALL">All cities</option>
            {METRO_ORDER.map((code) => (
              <option key={code} value={code}>
                {metroLabel(code)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="field-label">Search</span>
          <input
            className="field"
            placeholder="85016"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="flex h-[2.65rem] items-center gap-2 text-sm">
          <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
          Active only
        </label>
        <button
          type="button"
          className="h-[2.65rem] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 text-sm hover:border-[var(--accent)]"
          onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
        >
          Days to offer {sortDir === "asc" ? "Asc" : "Desc"}
        </button>
      </div>

      <p className="text-sm text-[var(--muted)]">
        {rows.length.toLocaleString()} listings
        {activeOnly ? " with Active only on" : ""}
        {rows.some((listing) => listing.status === "Sold") && activeOnly ? " · Sold rows are still in this list" : ""}
      </p>
      <div className="panel overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>ZIP</th>
              <th>Status</th>
              <th>Box</th>
              <th>Price</th>
              <th>Showings</th>
              <th>Days to offer</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map((listing) => {
              const agent = ramcoMemberForListing(listing);
              return (
                <tr key={listing.id}>
                  <td>
                    <Link href={listingPath(listing.id, "listings")} className="block whitespace-nowrap hover:text-[var(--accent)]">
                      {listing.address}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {agent.name}, REALTOR · {agent.officeName}
                    </p>
                  </td>
                  <td className="tabular text-[var(--muted)]">{listing.zip}</td>
                  <td>
                    <StatusBadge status={listing.status} />
                  </td>
                  <td>
                    <Link href={listingPath(listing.id, "listings", "lockbox")} className="block whitespace-nowrap hover:text-[var(--accent)]">
                      <span className="tabular text-xs">{boxSerial(listing)}</span>
                    </Link>
                    <div className="mt-1.5">
                      <LiveLockBadge listing={listing} />
                    </div>
                  </td>
                  <td className="tabular">{formatCurrency(listing.listPrice)}</td>
                  <td className="tabular">{listing.showings.length}</td>
                  <td className="tabular">{daysShowingToOffer(listing) ?? "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-12 text-center text-[var(--muted)]" colSpan={7}>
                  No listings match this search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Showing {Math.min(rows.length, 80)} of {rows.length} in this city.
      </p>
    </div>
  );
}
