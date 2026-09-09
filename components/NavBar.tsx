"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Market" },
  { href: "/conversions", label: "Conversions" },
  { href: "/demand", label: "Demand" },
  { href: "/listings", label: "Listings" },
  { href: "/boxes", label: "Boxes" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="nav-link" data-active={active}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
