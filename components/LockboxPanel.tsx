"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import {
  DEFAULT_LOCK_POLICY,
  MLS_LOCK_STATUSES,
  lockboxForListing,
  readLockPolicy,
  writeLockPolicy,
  type LockPolicy,
} from "@/lib/lockbox";
import type { Listing, ListingStatus } from "@/lib/types";
import { LockModeBadge } from "./LockModeBadge";
import { StatusBadge } from "./ui";

const STATUS_MEANING: Record<ListingStatus, string> = {
  Active: "On market. Buyers can still tour.",
  Pending: "Under contract. A buyer is in play.",
  Sold: "Closed. This one is done.",
  Withdrawn: "Pulled off the market.",
};

const AUTO_LOCK_HINT: Record<(typeof MLS_LOCK_STATUSES)[number], string> = {
  Pending: "When checked, lock the box as soon as the listing goes under contract.",
  Sold: "When checked, lock the box after closing so nobody can still get in.",
  Withdrawn: "When checked, lock the box if the listing is pulled off market.",
};

function loadPolicy(listingId: string): LockPolicy {
  return readLockPolicy(listingId) ?? DEFAULT_LOCK_POLICY;
}

export function LockboxPanel({ listing }: { listing: Listing }) {
  const [policy, setPolicy] = useState<LockPolicy>(DEFAULT_LOCK_POLICY);
  const box = useMemo(() => lockboxForListing(listing, policy), [listing, policy]);

  useEffect(() => {
    setPolicy(loadPolicy(listing.id));
  }, [listing.id]);

  function update(next: LockPolicy) {
    setPolicy(next);
    writeLockPolicy(listing.id, next);
  }

  function toggleStatus(status: ListingStatus) {
    const on = policy.autoLockOn.includes(status);
    update({
      ...policy,
      autoLockOn: on ? policy.autoLockOn.filter((item) => item !== status) : [...policy.autoLockOn, status],
    });
  }

  return (
    <section id="lockbox" className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Lockbox</p>
          <h2 className="stat mt-1 text-[1.45rem]">{box.serial}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">This listing is</span>
            <StatusBadge status={listing.status} />
            <span className="text-[var(--muted)]">{STATUS_MEANING[listing.status]}</span>
          </p>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{box.modeReason}</p>
        </div>
        <div className="text-right">
          <LockModeBadge mode={box.mode} />
          <p className="mt-2 text-xs text-[var(--muted)]">
            {box.lastAccessAt ? `Last opened ${formatDateTime(box.lastAccessAt)}` : "Not opened yet"}
            {` · ${box.batteryPct}%`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 border-t border-[var(--line)] pt-5 lg:grid-cols-2">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Lock the box when the listing becomes</legend>
          <p className="text-xs text-[var(--muted)]">
            These checkboxes are the rule, not the current status. Check a status to auto-lock the box when the MLS
            listing hits it. Unchecked means showings can still open the box at that status.
          </p>
          <div className="space-y-2.5">
            {MLS_LOCK_STATUSES.map((status) => {
              const isCurrent = listing.status === status;
              return (
                <label key={status} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={policy.autoLockOn.includes(status)}
                    onChange={() => toggleStatus(status)}
                  />
                  <span>
                    {status}
                    {isCurrent ? <span className="ml-2 text-xs font-medium text-[var(--accent)]">This listing</span> : null}
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{AUTO_LOCK_HINT[status]}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-3">
          <p className="text-sm font-medium">Quiet hours and off</p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={policy.quietEnabled}
              onChange={(event) => update({ ...policy, quietEnabled: event.target.checked })}
            />
            <span>
              Quiet hours
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                When checked, the box will not open during these hours (this computer&apos;s clock).
              </span>
            </span>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="field-label">From</span>
              <input
                type="time"
                className="field w-[9.5rem] tabular"
                value={policy.quietStart}
                onChange={(event) => update({ ...policy, quietStart: event.target.value })}
                disabled={!policy.quietEnabled}
              />
            </label>
            <label className="text-sm">
              <span className="field-label">To</span>
              <input
                type="time"
                className="field w-[9.5rem] tabular"
                value={policy.quietEnd}
                onChange={(event) => update({ ...policy, quietEnd: event.target.value })}
                disabled={!policy.quietEnabled}
              />
            </label>
            <p className="pb-2 text-sm text-[var(--muted)]">
              {policy.quietStart} to {policy.quietEnd}
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={policy.manualShutoff}
              onChange={(event) => update({ ...policy, manualShutoff: event.target.checked })}
            />
            <span>
              Shut the box off now
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Overrides listing status. Use this if you need it locked while the listing is still Active.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
