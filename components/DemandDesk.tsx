"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DemandMap, intensityFill, intensityLabel, type DemandMapPoint } from "@/components/DemandMap";
import { MetroChip } from "@/components/ui";
import { mapIntensity } from "@/lib/intelligence";
import { METRO_ORDER, METROS, metroLabel } from "@/lib/metros";
import type { Metro, ZipDemand } from "@/lib/types";

export function DemandDesk({
  rows,
  metroBoxes,
}: {
  rows: ZipDemand[];
  metroBoxes: Array<{ metro: Metro; open: number; locked: number; total: number }>;
}) {
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [metroFilter, setMetroFilter] = useState<Metro | "ALL">("ALL");
  const maxScore = rows[0]?.score ?? 1;
  const minScore = rows[rows.length - 1]?.score ?? 0;

  const ranked = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        rank: index + 1,
        intensity: mapIntensity(row.score, maxScore, minScore),
      })),
    [maxScore, minScore, rows],
  );

  const visible = metroFilter === "ALL" ? ranked : ranked.filter((row) => row.metro === metroFilter);

  const mapPoints: DemandMapPoint[] = useMemo(
    () =>
      ranked.map((row) => ({
        zip: row.zip,
        metro: row.metro,
        lat: row.lat,
        lng: row.lng,
        intensity: row.intensity,
        score: row.score,
        rank: row.rank,
      })),
    [ranked],
  );

  const selected = ranked.find((row) => row.zip === selectedZip) ?? null;

  useEffect(() => {
    if (!selectedZip) return;
    document.getElementById(`zip-${selectedZip}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedZip]);

  function selectZip(zip: string) {
    setSelectedZip(zip);
    const row = ranked.find((item) => item.zip === zip);
    if (row && metroFilter !== "ALL" && row.metro !== metroFilter) {
      setMetroFilter("ALL");
    }
  }

  function selectMetro(metro: Metro) {
    setMetroFilter((current) => (current === metro ? "ALL" : metro));
    setSelectedZip((current) => {
      const row = ranked.find((item) => item.zip === current);
      if (row && row.metro !== metro) return null;
      return current;
    });
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Demand by ZIP</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Click a row to see details and pick it on the map.</p>
            </div>
            {metroFilter !== "ALL" ? (
              <button type="button" className="text-sm text-[var(--accent)] hover:underline" onClick={() => setMetroFilter("ALL")}>
                Show all ZIPs
              </button>
            ) : null}
          </div>
          {selected ? (
            <div className="surface-inset mt-4 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium tracking-tight">
                  <span className="tabular">{selected.zip}</span>
                  {` · ${selected.city}`}
                </p>
                <MetroChip>{metroLabel(selected.metro)}</MetroChip>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Rank {selected.rank} of {ranked.length} in this market
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="kicker">Score</p>
                  <p className="stat mt-1 text-[1.35rem] leading-none">{selected.score.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Showings and offers combined</p>
                </div>
                <div>
                  <p className="kicker">Listings</p>
                  <p className="stat mt-1 text-[1.35rem] leading-none">{selected.listingCount.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Homes in this ZIP</p>
                </div>
                <div>
                  <p className="kicker">Map intensity</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-2 w-8 rounded-full"
                      style={{ backgroundColor: intensityFill(selected.intensity) }}
                    />
                    <span>{intensityLabel(selected.intensity)}</span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">From score vs other ZIPs</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">No ZIP selected. Click a row in the table.</p>
          )}
          <div className="mt-5 max-h-[540px] overflow-auto pr-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>ZIP</th>
                  <th>Metro</th>
                  <th>Score</th>
                  <th>Map intensity</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.zip}
                    id={`zip-${row.zip}`}
                    data-selected={row.zip === selectedZip ? "true" : "false"}
                    tabIndex={0}
                    onClick={() => selectZip(row.zip)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectZip(row.zip);
                      }
                    }}
                  >
                    <td className="tabular text-[var(--accent)]">{row.rank}</td>
                    <td className="tabular">{row.zip}</td>
                    <td>{metroLabel(row.metro)}</td>
                    <td className="tabular">{row.score.toLocaleString()}</td>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-8 rounded-full"
                          style={{ backgroundColor: intensityFill(row.intensity) }}
                        />
                        <span>{intensityLabel(row.intensity)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Map</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {mapPoints.length} ZIPs on this map
                {metroFilter !== "ALL" ? ` · table is filtered to ${visible.length}` : ""}. Click a ZIP. Drag or
                scroll to move.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              {[
                { label: "Low", value: 0.15 },
                { label: "Medium", value: 0.5 },
                { label: "High", value: 0.9 },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: intensityFill(item.value) }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          {selected ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Showing <span className="tabular text-[var(--text)]">{selected.zip}</span> on the map. Drag or scroll to
              move.
            </p>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">Pick a ZIP in the table or on the map.</p>
          )}
          <DemandMap
            points={mapPoints}
            selectedZip={selectedZip}
            focusMetro={metroFilter}
            onSelectZip={selectZip}
          />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {METRO_ORDER.map((metro) => (
              <button
                key={metro}
                type="button"
                className={`metro-chip ${metroFilter === metro ? "metro-chip-active" : ""}`}
                onClick={() => selectMetro(metro)}
              >
                {METROS[metro].city}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Boxes by city</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              How many boxes can still open in each city. Locked means Pending, Sold, or you shut it off. Click a city
              to filter the table and map.
            </p>
          </div>
          <Link href="/boxes" className="text-sm text-[var(--accent)] hover:underline">
            See boxes
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metroBoxes.map((row) => {
            const openShare = row.total === 0 ? 0 : (row.open / row.total) * 100;
            const active = metroFilter === row.metro;
            return (
              <button
                key={row.metro}
                type="button"
                onClick={() => selectMetro(row.metro)}
                className={`px-4 py-3 text-left ${active ? "surface-active" : "surface-inset"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <MetroChip>{metroLabel(row.metro)}</MetroChip>
                  <span className="tabular text-xs text-[var(--muted)]">{row.total}</span>
                </div>
                <p className="mt-3 text-sm">
                  <span className="tabular">{row.open}</span> open
                  <span className="text-[var(--muted)]"> · </span>
                  <span className="tabular">{row.locked}</span> locked
                </p>
                <div className="mt-2 h-1.5 overflow-hidden bg-[var(--bg-soft)]">
                  <div className="h-1.5 bg-[var(--ok)]" style={{ width: `${openShare}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
