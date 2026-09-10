export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="kpi-card">
      <p className="kicker">{label}</p>
      <p className="stat mt-3 text-[2rem] leading-none text-[var(--marine)]">{value}</p>
      {hint ? <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
