"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { METROS, metroLabel } from "@/lib/metros";
import type { Metro } from "@/lib/types";

const LNG_MIN = -124.8;
const LNG_MAX = -66.9;
const LAT_MIN = 24.4;
const LAT_MAX = 49.4;
const WIDTH = 960;
const HEIGHT = 560;
const CLUSTER_R = 34;

const CONUS: [number, number][] = [
  [48.38, -124.73],
  [48.99, -122.2],
  [49.0, -95.15],
  [47.98, -89.58],
  [46.48, -84.52],
  [45.35, -82.5],
  [43.62, -79.4],
  [45.01, -74.86],
  [44.98, -71.5],
  [47.28, -68.57],
  [44.8, -66.95],
  [43.05, -70.7],
  [42.87, -70.82],
  [41.48, -70.55],
  [41.3, -71.85],
  [40.55, -74.0],
  [39.18, -74.9],
  [38.0, -75.25],
  [36.9, -75.95],
  [35.22, -75.53],
  [34.58, -76.55],
  [33.86, -77.95],
  [32.08, -80.6],
  [30.72, -81.42],
  [25.78, -80.18],
  [24.96, -80.52],
  [25.2, -81.12],
  [26.4, -81.9],
  [27.82, -82.74],
  [29.15, -83.05],
  [30.16, -85.72],
  [30.38, -87.52],
  [30.22, -88.05],
  [30.38, -89.18],
  [29.18, -89.42],
  [29.55, -92.0],
  [29.72, -93.85],
  [27.82, -97.18],
  [25.98, -97.14],
  [26.35, -99.12],
  [29.3, -100.92],
  [29.76, -102.38],
  [31.78, -106.52],
  [31.78, -108.2],
  [31.33, -111.07],
  [32.53, -117.12],
  [34.05, -118.55],
  [34.45, -120.47],
  [36.6, -121.95],
  [37.78, -122.52],
  [39.05, -123.72],
  [40.44, -124.4],
  [42.0, -124.22],
  [43.38, -124.22],
  [46.18, -123.98],
  [47.88, -124.63],
  [48.38, -124.73],
];

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

const FULL_VIEW: ViewBox = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

function project(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (WIDTH - 48) + 24;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (HEIGHT - 56) + 28;
  return { x, y };
}

function spreadProject(point: DemandMapPoint, peers: DemandMapPoint[]) {
  const base = project(point.lat, point.lng);
  const group = peers.filter((item) => item.metro === point.metro).sort((a, b) => a.zip.localeCompare(b.zip));
  const index = group.findIndex((item) => item.zip === point.zip);
  if (index < 0 || group.length <= 1) return base;
  const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
  return { x: base.x + Math.cos(angle) * CLUSTER_R, y: base.y + Math.sin(angle) * CLUSTER_R };
}

export function intensityFill(intensity: number) {
  const r = Math.round(72 + intensity * 154);
  const g = Math.round(40 + intensity * 42);
  const b = Math.round(24 + intensity * 6);
  return `rgb(${r},${g},${b})`;
}

export function intensityLabel(intensity: number) {
  return intensity > 0.6 ? "High" : intensity > 0.3 ? "Medium" : "Low";
}

const LABEL_NUDGE: Record<Metro, { dx: number; dy: number }> = {
  PHX: { dx: -62, dy: 6 },
  DEN: { dx: 0, dy: -58 },
  DAL: { dx: -58, dy: -8 },
  AUS: { dx: 4, dy: 58 },
  BNA: { dx: 0, dy: -56 },
  ATL: { dx: 8, dy: 56 },
  CLT: { dx: 58, dy: -28 },
  TPA: { dx: 58, dy: 18 },
};

function toPath(points: [number, number][]) {
  return points
    .map(([lat, lng], index) => {
      const { x, y } = project(lat, lng);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function fitView(points: DemandMapPoint[], allPoints: DemandMapPoint[], padding = 88): ViewBox {
  if (points.length === 0) return FULL_VIEW;
  const pts = points.map((point) => spreadProject(point, allPoints));
  let minX = Math.min(...pts.map((point) => point.x));
  let maxX = Math.max(...pts.map((point) => point.x));
  let minY = Math.min(...pts.map((point) => point.y));
  let maxY = Math.max(...pts.map((point) => point.y));
  const minSpan = 140;
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

function viewForMetro(focusMetro: Metro | "ALL", points: DemandMapPoint[]): ViewBox {
  if (focusMetro === "ALL") return FULL_VIEW;
  return fitView(
    points.filter((point) => point.metro === focusMetro),
    points,
  );
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
  const land = `${toPath(CONUS)} Z`;
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; view: ViewBox; moved: boolean } | null>(null);
  const viewRef = useRef<ViewBox>(FULL_VIEW);
  const [hover, setHover] = useState<{ zip: string; x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const [view, setView] = useState<ViewBox>(FULL_VIEW);

  const grid = useMemo(() => {
    const meridians = [-120, -110, -100, -90, -80, -70].map((lng) => {
      const a = project(LAT_MAX - 0.4, lng);
      const b = project(LAT_MIN + 0.6, lng);
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    });
    const parallels = [30, 35, 40, 45].map((lat) => {
      const a = project(lat, LNG_MIN + 0.6);
      const b = project(lat, LNG_MAX - 0.6);
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    });
    return [...meridians, ...parallels].join(" ");
  }, []);

  useEffect(() => {
    const next = viewForMetro(focusMetro, points);
    viewRef.current = next;
    setView(next);
  }, [focusMetro, points]);

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
      const nextW = current.w * factor;
      const nextH = current.h * factor;
      const next = clampView({
        x: cursorX - px * nextW,
        y: cursorY - py * nextH,
        w: nextW,
        h: nextH,
      });
      viewRef.current = next;
      setView(next);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const selected = points.find((point) => point.zip === selectedZip);
  const others = points.filter((point) => point.zip !== selectedZip);

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
        <rect width={WIDTH} height={HEIGHT} fill="#0c0a08" pointerEvents="none" />
        <path d={grid} fill="none" stroke="rgba(243,234,220,0.045)" strokeWidth="1" pointerEvents="none" />
        <path d={land} fill="#1a1510" stroke="rgba(226,90,28,0.22)" strokeWidth="8" pointerEvents="none" />
        <path d={land} fill="#1f1913" stroke="rgba(243,234,220,0.18)" strokeWidth="1.25" pointerEvents="none" />
        {Object.entries(METROS).map(([code, metro]) => {
          const { x, y } = project(metro.lat, metro.lng);
          const active = focusMetro === code || selected?.metro === code;
          return (
            <circle
              key={`ring-${code}`}
              cx={x}
              cy={y}
              r={CLUSTER_R + 8}
              fill={active ? "rgba(226,90,28,0.08)" : "rgba(243,234,220,0.03)"}
              stroke={active ? "rgba(226,90,28,0.35)" : "rgba(243,234,220,0.08)"}
              strokeWidth="1"
              pointerEvents="none"
            />
          );
        })}
        {Object.entries(METROS).map(([code, metro]) => {
          const { x, y } = project(metro.lat, metro.lng);
          const nudge = LABEL_NUDGE[code as Metro];
          const active = focusMetro === code || selected?.metro === code;
          return (
            <text
              key={`label-${code}`}
              x={x + nudge.dx}
              y={y + nudge.dy}
              textAnchor="middle"
              fill={active ? "var(--accent)" : "rgba(243,234,220,0.55)"}
              fontSize="11"
              fontFamily="ui-monospace, SF Mono, Menlo, monospace"
              letterSpacing="0.06em"
              className="map-label"
              pointerEvents="none"
            >
              {metroLabel(code as Metro).toUpperCase()}
            </text>
          );
        })}
        {others.map((point) => {
          const { x, y } = spreadProject(point, points);
          const size = 6.5 + point.intensity * 8;
          return (
            <circle
              key={`map-${point.zip}`}
              className="map-dot"
              cx={x}
              cy={y}
              r={size}
              fill={intensityFill(point.intensity)}
              stroke="rgba(243,234,220,0.55)"
              strokeWidth="1.25"
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
          );
        })}
        {selected
          ? (() => {
              const { x, y } = spreadProject(selected, points);
              const size = 8 + selected.intensity * 8;
              return (
                <g>
                  <circle
                    cx={x}
                    cy={y}
                    r={size + 7}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    opacity="0.45"
                    pointerEvents="none"
                  />
                  <circle
                    className="map-dot"
                    cx={x}
                    cy={y}
                    r={size}
                    fill={intensityFill(selected.intensity)}
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    role="button"
                    tabIndex={0}
                    aria-label={`ZIP ${selected.zip}, selected`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  />
                </g>
              );
            })()
          : null}
      </svg>
      {hover
        ? (() => {
            const point = points.find((item) => item.zip === hover.zip);
            if (!point) return null;
            return (
              <div className="map-tip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
                <p className="tabular">{point.zip}</p>
                <p>
                  Rank {point.rank} · {metroLabel(point.metro)} · {intensityLabel(point.intensity)}
                </p>
                <p className="tabular">{point.score.toLocaleString()} score</p>
              </div>
            );
          })()
        : null}
    </div>
  );
}
