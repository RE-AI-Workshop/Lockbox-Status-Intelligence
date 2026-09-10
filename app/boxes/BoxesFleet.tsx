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

export function BoxesFleet({ listings }: { listings: Listing[] }) {
  const [metro, setMetro] = useState<Metro | "ALL">("ALL");
  const [mode, setMode] = useState<LockboxMode | "ALL">("ALL");
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

  return (
    <div className="space-y-4">
      <div className="panel grid gap-3 p-4 sm:grid-cols-[12rem_12rem] sm:items-end">
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
          <span className="field-label">Lock</span>
          <select
            className="field"
            value={mode}
            onChange={(event) => setMode(event.target.value as LockboxMode | "ALL")}
          >
            {MODE_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All" : lockModeLabel(value)}
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
            {rows.slice(0, 80).map(({ listing, box }) => (
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
      <p className="text-xs text-[var(--muted)]">
        Showing {Math.min(rows.length, 80)} of {rows.length} boxes you can click.
      </p>
    </div>
  );
}
