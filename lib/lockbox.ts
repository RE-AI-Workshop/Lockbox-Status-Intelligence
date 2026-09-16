import type { Listing, ListingStatus } from "./types";

export type LockboxMode = "available" | "quiet" | "manual-off" | "auto-locked";

export interface LockPolicy {
  autoLockOn: ListingStatus[];
  quietStart: string;
  quietEnd: string;
  quietEnabled: boolean;
  manualShutoff: boolean;
}

export interface LockboxView {
  serial: string;
  listingId: string;
  assignedAt: string;
  lastAccessAt?: string;
  lastAccessKind: "showing" | "inspection" | "appraiser" | "none";
  batteryPct: number;
  firmware: string;
  policy: LockPolicy;
  mode: LockboxMode;
  modeReason: string;
}

export const DEFAULT_LOCK_POLICY: LockPolicy = {
  autoLockOn: ["Pending", "Sold"],
  quietStart: "21:00",
  quietEnd: "07:00",
  quietEnabled: true,
  manualShutoff: false,
};

export const MLS_LOCK_STATUSES = ["Pending", "Sold", "Withdrawn"] as const;

const POLICY_PREFIX = "throughline.lock.";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function boxSerial(listing: Listing): string {
  const digits = listing.id.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `LBX-${listing.metro}-${digits}`;
}

export function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function inQuietHours(now: Date, start: string, end: string): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const from = parseClock(start);
  const to = parseClock(end);
  if (from === to) return false;
  if (from < to) return current >= from && current < to;
  return current >= from || current < to;
}

export function resolveLockMode(
  listing: Listing,
  policy: LockPolicy,
  now = new Date(),
): { mode: LockboxMode; reason: string } {
  if (policy.manualShutoff) {
    return {
      mode: "manual-off",
      reason: "You shut this box off. It will not open until you uncheck Shut the box off now.",
    };
  }
  if (policy.autoLockOn.includes(listing.status)) {
    return {
      mode: "auto-locked",
      reason: `Listing status is ${listing.status}, and that status is checked below, so the box stays locked. It will not open for a showing.`,
    };
  }
  if (policy.quietEnabled && inQuietHours(now, policy.quietStart, policy.quietEnd)) {
    return {
      mode: "quiet",
      reason: `Quiet hours are on from ${policy.quietStart} to ${policy.quietEnd}. The box stays closed overnight.`,
    };
  }
  return {
    mode: "available",
    reason: `Listing status is ${listing.status}. None of the checked statuses below match, so the box will open for a showing.`,
  };
}

export function lockboxForListing(listing: Listing, policy: LockPolicy = DEFAULT_LOCK_POLICY, now = new Date()): LockboxView {
  const lastShowing = listing.showings[listing.showings.length - 1];
  const seed = hashString(listing.id);
  const resolved = resolveLockMode(listing, policy, now);
  return {
    serial: boxSerial(listing),
    listingId: listing.id,
    assignedAt: listing.listedAt,
    lastAccessAt: lastShowing?.at,
    lastAccessKind: lastShowing ? "showing" : "none",
    batteryPct: 58 + (seed % 40),
    firmware: `3.${seed % 7}.${seed % 11}`,
    policy,
    mode: resolved.mode,
    modeReason: resolved.reason,
  };
}

export function readLockPolicy(listingId: string): LockPolicy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${POLICY_PREFIX}${listingId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LockPolicy>;
    return {
      ...DEFAULT_LOCK_POLICY,
      ...parsed,
      autoLockOn: Array.isArray(parsed.autoLockOn) ? parsed.autoLockOn : DEFAULT_LOCK_POLICY.autoLockOn,
    };
  } catch {
    return null;
  }
}

export function writeLockPolicy(listingId: string, policy: LockPolicy): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${POLICY_PREFIX}${listingId}`, JSON.stringify(policy));
}

export function lockModeLabel(mode: LockboxMode): string {
  if (mode === "manual-off") return "Manual shutoff";
  if (mode === "auto-locked") return "Auto-locked";
  if (mode === "quiet") return "Quiet hours";
  return "Available";
}

export function summarizeBoxes(listings: Listing[], policy: LockPolicy = DEFAULT_LOCK_POLICY) {
  const boxes = listings.map((listing) => lockboxForListing(listing, policy));
  const autoLocked = boxes.filter((box) => box.mode === "auto-locked").length;
  const open = boxes.filter((box) => box.mode === "available" || box.mode === "quiet").length;
  const shut = boxes.filter((box) => box.mode === "manual-off").length;
  const releases = listings.reduce((sum, listing) => sum + listing.showings.length, 0);
  const withOffers = listings.filter((listing) => listing.offers.length > 0).length;
  return { total: boxes.length, autoLocked, open, shut, releases, withOffers };
}

export const BOX_FLEET_CAPTION = {
  open: "Active listings whose box is not locked yet",
  autoLocked: "Pending or Sold listings, so the next showing cannot open the box",
} as const;

export function boxFleetKpi<K extends keyof typeof BOX_FLEET_CAPTION>(
  fleet: ReturnType<typeof summarizeBoxes>,
  metric: K,
) {
  return { value: fleet[metric], caption: BOX_FLEET_CAPTION[metric] };
}

export function boxesByMetro(listings: Listing[], policy: LockPolicy = DEFAULT_LOCK_POLICY) {
  const groups = new Map<string, { metro: Listing["metro"]; open: number; locked: number; total: number }>();
  for (const listing of listings) {
    const box = lockboxForListing(listing, policy);
    const current = groups.get(listing.metro) ?? { metro: listing.metro, open: 0, locked: 0, total: 0 };
    current.total += 1;
    if (box.mode === "auto-locked" || box.mode === "manual-off") current.locked += 1;
    else current.open += 1;
    groups.set(listing.metro, current);
  }
  return [...groups.values()];
}
