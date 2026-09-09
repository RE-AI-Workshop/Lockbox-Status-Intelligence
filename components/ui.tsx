import type { DemandLevel, Listing } from "@/lib/types";

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function StatusBadge({ status }: { status: Listing["status"] }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function DemandPill({ level }: { level: DemandLevel }) {
  return (
    <span className={`badge ${level === "High" ? "pill-High" : level === "Moderate" ? "pill-Moderate" : "pill-Low"}`}>
      Demand {level}
    </span>
  );
}

export function HealthMark({ health }: { health: "On track" | "At risk" | "Stalled" }) {
  const tone =
    health === "On track"
      ? "text-[var(--accent)]"
      : health === "At risk"
        ? "text-[var(--danger)]"
        : "text-[var(--muted)]";
  return <span className={`text-sm font-medium ${tone}`}>{health}</span>;
}

export function MetroChip({ children }: { children: React.ReactNode }) {
  return <span className="metro-chip">{children}</span>;
}

export function FeedbackChip({ value }: { value: string }) {
  const tone =
    value === "positive" ? "text-[var(--ok)]" : value === "negative" ? "text-[var(--danger)]" : "text-[var(--muted)]";
  return <span className={`text-xs ${tone}`}>{value} feedback</span>;
}
