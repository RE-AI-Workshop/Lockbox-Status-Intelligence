import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import exploreJson from "../data/explore.json";
import { buildRamcoMember, type RamcoRosterFile } from "../lib/ramco";
import type { ExploreFile } from "../lib/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const explore = exploreJson as ExploreFile;

const members: RamcoRosterFile["members"] = {};
for (const listing of explore.listings) {
  members[listing.id] = buildRamcoMember(listing);
}

const roster: RamcoRosterFile = {
  generatedAt: new Date().toISOString(),
  members,
};

writeFileSync(join(ROOT, "data/ramco-members.json"), `${JSON.stringify(roster)}\n`);

const inactive = Object.values(members).filter((member) => member.status === "Inactive").length;
console.log(`Wrote ${Object.keys(members).length} RAMCO members (${inactive} inactive)`);
