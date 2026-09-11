"use client";

import { useState } from "react";
import { anonymousPeers } from "@/lib/intelligence";
import type { Listing } from "@/lib/types";

export function AnonymousPeers({ listing, pool }: { listing: Listing; pool: Listing[] }) {
  const [open, setOpen] = useState(false);
  const comps = anonymousPeers(listing, pool);

  return (
    <section className="panel p-6">
      <h2 className="section-title">Comps</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Similar homes by list price. Street and MLS stay hidden until you hover.
      </p>
      <button
        type="button"
        className="mt-4 text-sm text-[var(--accent)] hover:underline"
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((value) => !value)}
      >
        Hover to show addresses
      </button>
      {open ? (
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {comps.map((comp) => (
            <li key={comp.id} className="bg-[var(--bg-soft)] px-3 py-2" title={`${comp.address} ${comp.mls}`}>
              {comp.address} · {comp.mls} · {comp.showings} showings
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">Street and MLS stay hidden until you review the comps.</p>
      )}
    </section>
  );
}
