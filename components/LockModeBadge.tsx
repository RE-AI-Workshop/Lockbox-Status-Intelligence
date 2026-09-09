import { lockModeLabel, type LockboxMode } from "@/lib/lockbox";

export function LockModeBadge({ mode }: { mode: LockboxMode }) {
  return <span className={`badge lock-${mode}`}>{lockModeLabel(mode)}</span>;
}
