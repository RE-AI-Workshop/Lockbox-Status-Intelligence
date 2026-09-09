"use client";

import { useEffect, useState } from "react";
import { LockModeBadge } from "@/components/LockModeBadge";
import { DEFAULT_LOCK_POLICY, lockboxForListing, readLockPolicy } from "@/lib/lockbox";
import type { Listing } from "@/lib/types";

export function LiveLockBadge({ listing }: { listing: Listing }) {
  const [mode, setMode] = useState(() => lockboxForListing(listing, DEFAULT_LOCK_POLICY).mode);

  useEffect(() => {
    const policy = readLockPolicy(listing.id) ?? DEFAULT_LOCK_POLICY;
    setMode(lockboxForListing(listing, policy).mode);
  }, [listing]);

  return <LockModeBadge mode={mode} />;
}
