"use client";

import { useState } from "react";
import { anonymousPeers } from "@/lib/intelligence";
import type { Listing } from "@/lib/types";

export function AnonymousPeers({ listing, pool }: { listing: Listing; pool: Listing[] }) {
  const [open, setOpen] = useState(false);
  const peers = anonymousPeers(listing, pool);

  return (
    <section className="panel p-6">
      <h2 className="section-title">Anonymous peer set</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Other listings like this one. Addresses stay hidden until you hover.</p>
      <button
        type="button"
        className="mt-4 text-sm text-[var(--accent)] hover:underline"
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((value) => !value)}
      >
        Hover to inspect peers
      </button>
      {open ? (
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {peers.map((peer) => (
            <li key={peer.id} className="bg-[var(--bg-soft)] px-3 py-2" title={`${peer.address} ${peer.mls}`}>
              {peer.address} · {peer.mls} · {peer.showings} showings
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">Addresses stay hidden until you inspect the set.</p>
      )}
    </section>
  );
}
