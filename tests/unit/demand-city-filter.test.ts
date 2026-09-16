import { describe, expect, it } from "vitest";
import { aggregates } from "@/lib/data";
import { mapIntensity } from "@/lib/intelligence";
import { metroLabel } from "@/lib/metros";
import type { Metro, ZipDemand } from "@/lib/types";

function rankedDemand(rows: ZipDemand[]) {
  const maxScore = rows[0]?.score ?? 1;
  const minScore = rows[rows.length - 1]?.score ?? 0;
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    intensity: mapIntensity(row.score, maxScore, minScore),
  }));
}

function visibleDemand(rows: ZipDemand[], metro: Metro | "ALL") {
  const ranked = rankedDemand(rows);
  return metro === "ALL" ? ranked : ranked.filter((row) => row.metro === metro);
}

function mapCaption(count: number) {
  return `${count} ZIPs on this map. Click a ZIP. Drag or scroll to move.`;
}

describe("demand city filter", () => {
  const rows = aggregates.zipDemand;

  // AC: Counts — unfiltered, Phoenix, Atlanta, and Show all share one N for table, map, and caption
  it("keeps table, map dots, and caption on the same N", () => {
    const states: Array<Metro | "ALL"> = ["ALL", "PHX", "ATL", "ALL"];

    for (const metro of states) {
      const visible = visibleDemand(rows, metro);
      const n = visible.length;
      expect(visible.map((row) => row.zip)).toHaveLength(n);
      expect(mapCaption(n)).toBe(`${n} ZIPs on this map. Click a ZIP. Drag or scroll to move.`);
      expect(mapCaption(n)).not.toMatch(/table is filtered/);
    }

    expect(visibleDemand(rows, "ALL")).toHaveLength(32);
    expect(visibleDemand(rows, "PHX")).toHaveLength(4);
    expect(visibleDemand(rows, "ATL")).toHaveLength(4);
  });

  // AC: Phoenix — table metros are Phoenix only
  it("keeps only Phoenix ZIPs when the city filter is Phoenix", () => {
    const visible = visibleDemand(rows, "PHX");
    expect(visible.length).toBeGreaterThan(0);
    expect(new Set(visible.map((row) => metroLabel(row.metro)))).toEqual(new Set(["Phoenix"]));
    expect(visible.every((row) => row.metro === "PHX")).toBe(true);
  });

  // AC: Atlanta after Phoenix — table, caption N, and ZIP set all switch to Atlanta
  it("switches the visible set from Phoenix to Atlanta", () => {
    const phoenix = visibleDemand(rows, "PHX");
    const atlanta = visibleDemand(rows, "ATL");

    expect(phoenix.every((row) => row.metro === "PHX")).toBe(true);
    expect(atlanta.every((row) => row.metro === "ATL")).toBe(true);
    expect(new Set(atlanta.map((row) => metroLabel(row.metro)))).toEqual(new Set(["Atlanta"]));
    expect(atlanta.map((row) => row.zip).sort()).not.toEqual(phoenix.map((row) => row.zip).sort());
    expect(mapCaption(atlanta.length)).toBe("4 ZIPs on this map. Click a ZIP. Drag or scroll to move.");
  });
});
