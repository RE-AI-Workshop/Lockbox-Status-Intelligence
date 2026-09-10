"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSHOP_LABS } from "@/lib/workshop-labs";

export function WorkshopNav() {
  const pathname = usePathname();

  return (
    <nav className="surface-inset flex flex-wrap gap-2 p-2 text-sm">
      {Object.values(WORKSHOP_LABS).map((lab) => {
        const active = pathname === lab.href;
        return (
          <Link
            key={lab.href}
            href={lab.href}
            className={`rounded-[var(--radius)] px-3 py-1.5 ${
              active ? "btn-accent" : "text-[var(--muted)] hover:bg-[var(--accent-light)] hover:text-[var(--text)]"
            }`}
          >
            {lab.label}
          </Link>
        );
      })}
    </nav>
  );
}
