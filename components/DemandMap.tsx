"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import usConus from "@/data/us-conus.json";
import { METROS, metroLabel } from "@/lib/metros";
import type { Metro } from "@/lib/types";

const WIDTH = 960;
const HEIGHT = 560;
const PAD = 28;

/** [lng, lat] rings for CONUS states */
const STATE_RINGS = usConus as [number, number][][];

export interface DemandMapPoint {
  zip: string;
  metro: Metro;
  intensity: number;
  lat: number;
  lng: number;
  score: number;
  rank: number;
}

type ViewBox = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };

const RAD = Math.PI / 180;
const PHI0 = 37.5 * RAD;
const PHI1 = 29.5 * RAD;
const PHI2 = 45.5 * RAD;
const LAM0 = -96 * RAD;
const N = (Math.sin(PHI1) + Math.sin(PHI2)) / 2;
const C = Math.cos(PHI1) ** 2 + 2 * N * Math.sin(PHI1);
const RHO0 = Math.sqrt(C - 2 * N * Math.sin(PHI0)) / N;

function rawAlbers(lat: number, lng: number): Point {
  const phi = lat * RAD;
  const lam = lng * RAD;
  const theta = N * (lam - LAM0);
  const rho = Math.sqrt(C - 2 * N * Math.sin(phi)) / N;
  return { x: rho * Math.sin(theta), y: RHO0 - rho * Math.cos(theta) };
}

const LAND_RAW = STATE_RINGS.flatMap((ring) => ring.map(([lng, lat]) => rawAlbers(lat, lng)));
const RAW_MIN_X = Math.min(...LAND_RAW.map((point) => point.x));
const RAW_MAX_X = Math.max(...LAND_RAW.map((point) => point.x));
const RAW_MIN_Y = Math.min(...LAND_RAW.map((point) => point.y));
const RAW_MAX_Y = Math.max(...LAND_RAW.map((point) => point.y));
const SCALE = Math.min((WIDTH - PAD * 2) / (RAW_MAX_X - RAW_MIN_X), (HEIGHT - PAD * 2) / (RAW_MAX_Y - RAW_MIN_Y));
const OFFSET_X = (WIDTH - (RAW_MAX_X - RAW_MIN_X) * SCALE) / 2;
const OFFSET_Y = (HEIGHT - (RAW_MAX_Y - RAW_MIN_Y) * SCALE) / 2;

function snap(value: number) {
  return Math.round(value * 100) / 100;
}

function project(lat: number, lng: number): Point {
  const raw = rawAlbers(lat, lng);
  return {
    x: snap((raw.x - RAW_MIN_X) * SCALE + OFFSET_X),
    y: snap(HEIGHT - ((raw.y - RAW_MIN_Y) * SCALE + OFFSET_Y)),
  };
}

function ringPath(ring: [number, number][]) {
  return `${ring
    .map(([lng, lat], index) => {
      const { x, y } = project(lat, lng);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")} Z`;
}

const STATE_PATHS = STATE_RINGS.map(ringPath);

export function intensityFill(intensity: number) {
  const low = [186, 214, 240];
  const mid = [0, 117, 231];
  const high = [0, 40, 85];
  const source = intensity < 0.5 ? low : mid;
  const target = intensity < 0.5 ? mid : high;
  const blend = intensity < 0.5 ? intensity * 2 : (intensity - 0.5) * 2;
  const r = Math.round(source[0] + blend * (target[0] - source[0]));
  const g = Math.round(source[1] + blend * (target[1] - source[1]));
  const b = Math.round(source[2] + blend * (target[2] - source[2]));
  return `rgb(${r},${g},${b})`;
}

export function intensityLabel(intensity: number) {
  return intensity > 0.6 ? "High" : intensity > 0.3 ? "Medium" : "Low";
}

const LABEL_NUDGE: Record<Metro, { dx: number; dy: number }> = {
  PHX: { dx: -52, dy: 4 },
  DEN: { dx: 0, dy: -28 },
  DAL: { dx: -46, dy: -6 },
  AUS: { dx: 8, dy: 32 },
  BNA: { dx: -8, dy: -28 },
  ATL: { dx: 10, dy: 30 },
  CLT: { dx: 44, dy: -10 },
  TPA: { dx: 44, dy: 16 },
};

type PlacedPoint = DemandMapPoint & Point;

function spreadOverlaps(points: PlacedPoint[], focusMetro: Metro | "ALL"): PlacedPoint[] {
  const groups = new Map<Metro, PlacedPoint[]>();
  for (const point of points) {
    const group = groups.get(point.metro) ?? [];
    group.push(point);
    groups.set(point.metro, group);
  }

  const placed: PlacedPoint[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      placed.push(group[0]);
      continue;
    }
    const sorted = [...group].sort((a, b) => a.zip.localeCompare(b.zip));
    const cx = sorted.reduce((sum, point) => sum + point.x, 0) / sorted.length;
    const cy = sorted.reduce((sum, point) => sum + point.y, 0) / sorted.length;
    const radius = (focusMetro !== "ALL" && sorted[0].metro === focusMetro ? 22 : 12) + (sorted.length - 2);
    sorted.forEach((point, index) => {
      const angle = (index / sorted.length) * Math.PI * 2 - Math.PI / 2;
      placed.push({
        ...point,
        x: snap(cx + Math.cos(angle) * radius),
        y: snap(cy + Math.sin(angle) * radius),
      });
    });
  }
  return placed.sort((a, b) => a.intensity - b.intensity);
}

const FULL_VIEW: ViewBox = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

function fitView(points: Point[], padding = 72): ViewBox {
  if (points.length === 0) return FULL_VIEW;
  let minX = Math.min(...points.map((point) => point.x));
  let maxX = Math.max(...points.map((point) => point.x));
  let minY = Math.min(...points.map((point) => point.y));
  let maxY = Math.max(...points.map((point) => point.y));
  const minSpan = 160;
  if (maxX - minX < minSpan) {
    const mid = (minX + maxX) / 2;
    minX = mid - minSpan / 2;
    maxX = mid + minSpan / 2;
  }
  if (maxY - minY < minSpan) {
    const mid = (minY + maxY) / 2;
    minY = mid - minSpan / 2;
    maxY = mid + minSpan / 2;
  }
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  let w = maxX - minX;
  let h = maxY - minY;
  const aspect = WIDTH / HEIGHT;
  if (w / h > aspect) {
    const extra = w / aspect - h;
    minY -= extra / 2;
    h = w / aspect;
  } else {
    const extra = h * aspect - w;
    minX -= extra / 2;
    w = h * aspect;
  }
  return { x: minX, y: minY, w, h };
}

function clampView(view: ViewBox): ViewBox {
  return {
    x: Math.min(WIDTH - 80, Math.max(-80, view.x)),
    y: Math.min(HEIGHT - 80, Math.max(-80, view.y)),
    w: Math.min(WIDTH * 1.15, Math.max(160, view.w)),
    h: Math.min(HEIGHT * 1.15, Math.max(94, view.h)),
  };
}

export function DemandMap({
  points,
  selectedZip,
  focusMetro,
  onSelectZip,
}: {
  points: DemandMapPoint[];
  selectedZip: string | null;
  focusMetro: Metro | "ALL";
  onSelectZip: (zip: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; view: ViewBox; moved: boolean } | null>(null);
  const viewRef = useRef<ViewBox>(FULL_VIEW);
  const [hover, setHover] = useState<{ zip: string; x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const [view, setView] = useState<ViewBox>(FULL_VIEW);

  const projected = useMemo(
    () =>
      spreadOverlaps(
        points.map((point) => ({ ...point, ...project(point.lat, point.lng) })),
        focusMetro,
      ),
    [focusMetro, points],
  );

  const metroHeat = useMemo(() => {
    return (Object.keys(METROS) as Metro[]).map((metro) => {
      const group = projected.filter((point) => point.metro === metro);
      const center = project(METROS[metro].lat, METROS[metro].lng);
      const peak = group.reduce((max, point) => Math.max(max, point.intensity), 0);
      return { metro, ...center, peak, count: group.length };
    });
  }, [projected]);

  useEffect(() => {
    const focused = focusMetro === "ALL" ? projected : projected.filter((point) => point.metro === focusMetro);
    const next = focusMetro === "ALL" ? FULL_VIEW : fitView(focused);
    viewRef.current = next;
    setView(next);
  }, [focusMetro, projected]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewRef.current;
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const cursorX = px * current.w + current.x;
      const cursorY = py * current.h + current.y;
      const factor = event.deltaY > 0 ? 1.08 : 0.93;
      const next = clampView({
        x: cursorX - px * current.w * factor,
        y: cursorY - py * current.h * factor,
        w: current.w * factor,
        h: current.h * factor,
      });
      viewRef.current = next;
      setView(next);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const selected = projected.find((point) => point.zip === selectedZip);
  const others = projected.filter((point) => point.zip !== selectedZip);

  function endPan() {
    dragRef.current = null;
    setPanning(false);
  }

  return (
    <div
      ref={canvasRef}
      className={`map-canvas mt-5 ${panning ? "is-panning" : ""}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragRef.current = { x: event.clientX, y: event.clientY, view, moved: false };
      }}
      onPointerMove={(event) => {
        if (!dragRef.current || !canvasRef.current) return;
        const dxPx = event.clientX - dragRef.current.x;
        const dyPx = event.clientY - dragRef.current.y;
        if (!dragRef.current.moved && Math.hypot(dxPx, dyPx) < 6) return;
        if (!dragRef.current.moved) {
          dragRef.current.moved = true;
          setPanning(true);
          canvasRef.current.setPointerCapture(event.pointerId);
        }
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = (dxPx / rect.width) * dragRef.current.view.w;
        const dy = (dyPx / rect.height) * dragRef.current.view.h;
        const next = clampView({
          ...dragRef.current.view,
          x: dragRef.current.view.x - dx,
          y: dragRef.current.view.y - dy,
        });
        viewRef.current = next;
        setView(next);
      }}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerLeave={() => {
        endPan();
        setHover(null);
      }}
    >
      <svg
        className="map-svg absolute inset-0 h-full w-full"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="img"
        aria-label="Demand map. Click a ZIP. Drag or scroll to move."
      >
        <rect width={WIDTH} height={HEIGHT} fill="#d5e0ea" pointerEvents="none" />
        {STATE_PATHS.map((path, index) => (
          <path
            key={`state-${index}`}
            d={path}
            fill="#f7fafc"
            stroke="#7d92a6"
            strokeWidth="0.7"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}
        {metroHeat.map((metro) => {
          const active = focusMetro === metro.metro || selected?.metro === metro.metro;
          return (
            <circle
              key={`heat-${metro.metro}`}
              cx={metro.x}
              cy={metro.y}
              r={snap(18 + metro.peak * 14)}
              fill={active ? "rgba(0,117,231,0.16)" : "rgba(0,117,231,0.08)"}
              pointerEvents="none"
            />
          );
        })}
        {metroHeat.map((metro) => {
          const nudge = LABEL_NUDGE[metro.metro];
          const active = focusMetro === metro.metro || selected?.metro === metro.metro;
          return (
            <text
              key={`label-${metro.metro}`}
              x={metro.x + nudge.dx}
              y={metro.y + nudge.dy}
              textAnchor="middle"
              fill={active ? "#002855" : "#5a6b7c"}
              fontSize="11"
              fontFamily="var(--font-sans), system-ui, sans-serif"
              fontWeight={active ? 650 : 500}
              className="map-label"
            >
              {metroLabel(metro.metro)}
            </text>
          );
        })}
        {others.map((point) => (
          <circle
            key={`map-${point.zip}`}
            className="map-dot"
            cx={point.x}
            cy={point.y}
            r={snap(3.2 + point.intensity * 2.4)}
            fill={intensityFill(point.intensity)}
            stroke="#ffffff"
            strokeWidth="1.1"
            role="button"
            tabIndex={0}
            aria-label={`ZIP ${point.zip}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onSelectZip(point.zip);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectZip(point.zip);
              }
            }}
            onMouseEnter={(event) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              setHover({ zip: point.zip, x: event.clientX - rect.left, y: event.clientY - rect.top });
            }}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {selected ? (
          <g>
            <circle cx={selected.x} cy={selected.y} r={10} fill="none" stroke="#0075e7" strokeWidth="1.5" opacity="0.35" />
            <circle
              className="map-dot"
              cx={selected.x}
              cy={selected.y}
              r={snap(4.4 + selected.intensity * 2.4)}
              fill={intensityFill(selected.intensity)}
              stroke="#0075e7"
              strokeWidth="2"
              role="button"
              tabIndex={0}
              aria-label={`ZIP ${selected.zip}, selected`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            />
          </g>
        ) : null}
      </svg>
      {hover
        ? (() => {
            const point = points.find((item) => item.zip === hover.zip);
            if (!point) return null;
            return (
              <div className="map-tip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
                <p className="font-semibold tabular">{point.zip}</p>
                <p className="text-[var(--muted)]">
                  Rank {point.rank} · {metroLabel(point.metro)} · {intensityLabel(point.intensity)}
                </p>
                <p className="tabular font-medium">{point.score.toLocaleString()} score</p>
              </div>
            );
          })()
        : null}
    </div>
  );
}
