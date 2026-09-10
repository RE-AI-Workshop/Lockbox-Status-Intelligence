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
          <legend className="text-sm font-medium">Lock the box when status is</legend>
          <p className="text-xs text-[var(--muted)]">
            Pending or Sold should lock the box so the next showing cannot open it.
          </p>
          <div className="flex flex-wrap gap-3">
            {MLS_LOCK_STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={policy.autoLockOn.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-3">
          <p className="text-sm font-medium">Quiet hours and off</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={policy.quietEnabled}
              onChange={(event) => update({ ...policy, quietEnabled: event.target.checked })}
            />
            Quiet hours (uses this computer&apos;s clock)
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
              Manual shutoff
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Turn the box off now, even if the listing is still Active.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
