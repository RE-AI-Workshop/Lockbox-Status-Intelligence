"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LockModeBadge } from "@/components/LockModeBadge";
import { StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import {
  DEFAULT_LOCK_POLICY,
  lockModeLabel,
  lockboxForListing,
  readLockPolicy,
  type LockboxMode,
} from "@/lib/lockbox";
import { METRO_ORDER, metroLabel } from "@/lib/metros";
import { listingPath } from "@/lib/paths";
import type { Listing, Metro } from "@/lib/types";

const MODE_FILTERS: Array<LockboxMode | "ALL"> = ["ALL", "available", "quiet", "auto-locked", "manual-off"];
const DEFAULT_PAGE_SIZE = 80;
const PAGE_SIZES = [50, DEFAULT_PAGE_SIZE, 100, 150, 200, 250, 300];

export function BoxesFleet({ listings }: { listings: Listing[] }) {
  const [metro, setMetro] = useState<Metro | "ALL">("ALL");
  const [mode, setMode] = useState<LockboxMode | "ALL">("ALL");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [useStored, setUseStored] = useState(false);

  useEffect(() => {
    setUseStored(true);
  }, []);

  const rows = useMemo(() => {
    const next = listings
      .filter((listing) => (metro === "ALL" ? true : listing.metro === metro))
      .map((listing) => {
        const policy = useStored ? (readLockPolicy(listing.id) ?? DEFAULT_LOCK_POLICY) : DEFAULT_LOCK_POLICY;
        return { listing, box: lockboxForListing(listing, policy) };
      })
      .filter((row) => (mode === "ALL" ? true : row.box.mode === mode));
    return next;
  }, [listings, metro, mode, useStored]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <div className="panel grid gap-3 p-4 sm:grid-cols-[12rem_12rem_12rem] sm:items-end">
        <label className="text-sm">
          <span className="field-label">City</span>
          <select
            className="field"
            value={metro}
            onChange={(event) => {
              setMetro(event.target.value as Metro | "ALL");
              setPage(1);
            }}
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
          <span className="field-label">Lock</span>
          <select
            className="field"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as LockboxMode | "ALL");
              setPage(1);
            }}
          >
            {MODE_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All" : lockModeLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="field-label">Rows per page</span>
          <select
            className="field"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Box</th>
              <th>Listing</th>
              <th>Listing status</th>
              <th>Lock</th>
              <th>Last opened</th>
              <th>Battery</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ listing, box }) => (
              <tr key={listing.id}>
                <td className="tabular">
                  <Link href={listingPath(listing.id, "boxes", "lockbox")} className="block whitespace-nowrap hover:text-[var(--accent)]">
                    {box.serial}
                  </Link>
                </td>
                <td>
                  <Link href={listingPath(listing.id, "boxes")} className="block whitespace-nowrap hover:text-[var(--accent)]">
                    {listing.address}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {listing.city} · {listing.mls}
                  </p>
                </td>
                <td>
                  <StatusBadge status={listing.status} />
                </td>
                <td>
                  <LockModeBadge mode={box.mode} />
                </td>
                <td className="text-sm text-[var(--muted)]">
                  {box.lastAccessAt ? formatDateTime(box.lastAccessAt) : "—"}
                </td>
                <td className="tabular">{box.batteryPct}%</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-12 text-center text-[var(--muted)]" colSpan={6}>
                  No boxes match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          {rows.length === 0
            ? "Showing 0 of 0 boxes"
            : `Showing ${start + 1}\u2013${start + visible.length} of ${rows.length} boxes`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-[var(--line)]"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span className="text-xs text-[var(--muted)]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-[var(--line)]"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
