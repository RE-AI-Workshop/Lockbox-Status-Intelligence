"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSHOP_LABS } from "@/lib/workshop-labs";

export function WorkshopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border border-[var(--line)] bg-[#100d0a] p-2 text-sm">
      {Object.values(WORKSHOP_LABS).map((lab) => {
        const active = pathname === lab.href;
        return (
          <Link
            key={lab.href}
            href={lab.href}
            className={`px-3 py-1.5 ${
              active ? "bg-[var(--accent)] text-[#1b120c]" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {lab.label}
          </Link>
        );
      })}
    </nav>
  );
}
