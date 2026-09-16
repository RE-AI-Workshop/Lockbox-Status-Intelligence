"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LiveLockBadge } from "@/components/LiveLockBadge";
import { RamcoStatusBadge, StatusBadge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { compareDaysToOffer, daysShowingToOffer, isActiveStatus, matchesQuery } from "@/lib/intelligence";
import { LISTINGS_PAGE_SIZE } from "@/lib/listings";
import { boxSerial } from "@/lib/lockbox";
import { METRO_ORDER, metroLabel } from "@/lib/metros";
import { listingPath } from "@/lib/paths";
import { ramcoMemberForListing } from "@/lib/ramco";
import type { Listing, Metro } from "@/lib/types";

type Filters = {
  metro: Metro | "ALL";
  query: string;
  activeOnly: boolean;
  sortDir: "asc" | "desc";
};

/** Survives client navigations within the tab; cleared on hard refresh. */
let memory: Filters | null = null;

export function ListingsExplorer({ listings }: { listings: Listing[] }) {
  const [filters, setFilters] = useState<Filters>(
    () => memory ?? { metro: "ALL", query: "", activeOnly: false, sortDir: "asc" },
  );
  const [page, setPage] = useState(1);
  const { metro, query, activeOnly, sortDir } = filters;

  function applyFilters(patch: Partial<Filters>, resetPage = true) {
    setFilters((current) => {
      const next = { ...current, ...patch };
      memory = next;
      return next;
    });
    if (resetPage) setPage(1);
  }

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

  const pageCount = Math.max(1, Math.ceil(rows.length / LISTINGS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * LISTINGS_PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + LISTINGS_PAGE_SIZE);
  const showingFrom = rows.length === 0 ? 0 : pageStart + 1;
  const showingTo = pageStart + pageRows.length;

  return (
    <div className="space-y-4">
      <div className="panel grid gap-3 p-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto_auto] sm:items-end">
        <label className="text-sm">
          <span className="field-label">City</span>
          <select
            className="field"
            value={metro}
            onChange={(event) => applyFilters({ metro: event.target.value as Metro | "ALL" })}
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
            onChange={(event) => applyFilters({ query: event.target.value })}
          />
        </label>
        <label className="flex h-[2.65rem] items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => applyFilters({ activeOnly: event.target.checked })}
          />
          Active only
        </label>
        <button
          type="button"
          className="h-[2.65rem] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 text-sm hover:border-[var(--accent)]"
          onClick={() => applyFilters({ sortDir: sortDir === "asc" ? "desc" : "asc" }, false)}
        >
          Days to offer {sortDir === "asc" ? "Asc" : "Desc"}
        </button>
      </div>

      <p className="text-sm text-[var(--muted)]">
        {rows.length.toLocaleString()} listings
        {activeOnly ? " with Active only on" : ""}
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
            {pageRows.map((listing) => {
              const agent = ramcoMemberForListing(listing);
              return (
                <tr key={listing.id}>
                  <td>
                    <Link href={listingPath(listing.id, "listings")} className="block whitespace-nowrap hover:text-[var(--accent)]">
                      {listing.address}
                    </Link>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={agent.status === "Inactive" ? "font-medium text-[var(--danger)]" : "text-[var(--muted)]"}
                        title={agent.status === "Inactive" ? "RAMCO says inactive" : undefined}
                      >
                        {agent.name}, REALTOR
                      </span>
                      <RamcoStatusBadge status={agent.status} />
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          {rows.length === 0
            ? "Showing 0 of 0 in this city."
            : `Showing ${showingFrom}–${showingTo} of ${rows.length} in this city.`}
        </p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 text-sm hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
            >
              Previous
            </button>
            <span className="tabular text-xs text-[var(--muted)]">
              Page {safePage} of {pageCount}
            </span>
            <button
              type="button"
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 text-sm hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage >= pageCount}
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
