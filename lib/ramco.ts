import type { Listing, Metro } from "./types";

export interface RamcoMember {
  name: string;
  memberType: "REALTOR";
  status: "Active";
  nrdsId: string;
  joinedAt: string;
  licenseNumber: string;
  licenseState: string;
  officeName: string;
  officeId: string;
  primaryAssociation: string;
  stateAssociation: string;
  email: string;
  phone: string;
  designations: string[];
  duesPaidThrough: string;
  lastSyncedAt: string;
}

const FIRST_NAMES = [
  "Maya",
  "Elena",
  "Jordan",
  "Priya",
  "Marcus",
  "Claire",
  "Devon",
  "Sofia",
  "Andre",
  "Naomi",
  "Luis",
  "Harper",
];

const LAST_NAMES = [
  "Chen",
  "Alvarez",
  "Brooks",
  "Patel",
  "Nguyen",
  "Walsh",
  "Okonkwo",
  "Rivera",
  "Kim",
  "Foster",
  "Haddad",
  "Ellis",
];

const OFFICES: Record<Metro, readonly [string, string, string, string]> = {
  PHX: ["Copperline Realty", "Phoenix Association of REALTORS", "Arizona Association of REALTORS", "copperline"],
  ATL: ["Peachtree Lane Group", "Atlanta REALTORS Association", "Georgia Association of REALTORS", "peachtreelane"],
  DAL: ["Trinity Oak Partners", "MetroTex Association of REALTORS", "Texas REALTORS", "trinityoak"],
  DEN: ["Front Range Collective", "Denver Metro Association of REALTORS", "Colorado Association of REALTORS", "frontrange"],
  TPA: ["Bayshore & Co.", "Greater Tampa REALTORS", "Florida REALTORS", "bayshore"],
  CLT: ["Queen City Street Realty", "Charlotte Regional REALTOR Association", "North Carolina REALTORS", "queencity"],
  BNA: ["Cumberland House Group", "Greater Nashville REALTORS", "Tennessee REALTORS", "cumberland"],
  AUS: ["Barton Creek Partners", "Austin Board of REALTORS", "Texas REALTORS", "bartoncreek"],
};

const LICENSE_STATE: Record<Metro, string> = {
  PHX: "AZ",
  ATL: "GA",
  DAL: "TX",
  DEN: "CO",
  TPA: "FL",
  CLT: "NC",
  BNA: "TN",
  AUS: "TX",
};

const AREA_CODES: Record<Metro, string> = {
  PHX: "602",
  ATL: "404",
  DAL: "214",
  DEN: "303",
  TPA: "813",
  CLT: "704",
  BNA: "615",
  AUS: "512",
};

const DESIGNATIONS = ["GRI", "CRS", "ABR", "SRES", "CIPS"] as const;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[Math.floor(seed / salt) % items.length];
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function ramcoMemberForListing(listing: Listing): RamcoMember {
  const seed = hashString(listing.id);
  const first = pick(FIRST_NAMES, seed, 7);
  const last = pick(LAST_NAMES, seed, 13);
  const [officeName, primaryAssociation, stateAssociation, officeSlug] = OFFICES[listing.metro];
  const licenseState = LICENSE_STATE[listing.metro];
  const area = AREA_CODES[listing.metro];
  const joinYear = 2009 + (seed % 15);
  const joinMonth = 1 + (Math.floor(seed / 16) % 12);
  const joinDay = 1 + (Math.floor(seed / 256) % 28);
  const designationCount = seed % 3;
  const designations = DESIGNATIONS.filter((_, index) => Math.floor(seed / 4 ** (index + 1)) % 3 === 0).slice(
    0,
    designationCount,
  );
  const local = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");

  return {
    name: `${first} ${last}`,
    memberType: "REALTOR",
    status: "Active",
    nrdsId: pad(100000000 + (seed % 800000000), 9),
    joinedAt: `${joinYear}-${pad(joinMonth, 2)}-${pad(joinDay, 2)}T12:00:00.000Z`,
    licenseNumber: `${licenseState} ${650000 + (seed % 249999)}`,
    licenseState,
    officeName,
    officeId: `O-${pad(10000 + (seed % 89999), 5)}`,
    primaryAssociation,
    stateAssociation,
    email: `${local}@${officeSlug}.com`,
    phone: `(${area}) 555-${pad(1000 + (seed % 9000), 4)}`,
    designations,
    duesPaidThrough: "2026-12-31T12:00:00.000Z",
    lastSyncedAt: "2026-09-10T14:22:00.000Z",
  };
}
