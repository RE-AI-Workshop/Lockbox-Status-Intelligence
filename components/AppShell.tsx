import Link from "next/link";
import { NavBar } from "@/components/NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="desk-tick">50,000 listings · 8 cities · showings, contracts, and boxes</div>
      <header className="site-header">
        <div className="mx-auto flex max-w-[80rem] flex-col gap-2 px-5 py-3 lg:flex-row lg:items-end lg:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="mark">T</span>
            <span className="wordmark">Throughline</span>
          </Link>
          <NavBar />
        </div>
      </header>
      <main className="mx-auto max-w-[80rem] px-5 py-8">{children}</main>
      <footer className="border-t border-[var(--line)] px-5 py-5">
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <p>50,000 listings in this market.</p>
          <Link href="/workshop" className="text-[var(--accent)] hover:underline">
            Workshop
          </Link>
        </div>
      </footer>
    </div>
  );
}
