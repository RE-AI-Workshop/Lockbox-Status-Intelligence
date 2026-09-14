"use client";

import { useState } from "react";

const HINT_LEVELS = [
  {
    title: "Level 1 · Where to look",
    description: "A light nudge without naming a bug.",
    hints: [
      "Read labels, helper text, and numbers together. Many bugs are contradictions, not crashes.",
      "Use the control named in your assigned zone, then read what changed—and what did not.",
      "Compare Market and Conversions when the same metric name appears on both pages.",
      "On listing details, compare nearby facts: status, showings, offers, demand, recommendations, and section headings.",
    ],
  },
  {
    title: "Level 2 · What to try",
    description: "Specific actions for each hunt zone.",
    hints: [
      "A or J: compare Showing to offer and Median days to offer on Market versus Conversions.",
      "B: read a watchlist card with many showings and no offers. On its detail page, change the lock policy and re-read the header chip without leaving.",
      "C: inspect each rate card, the funnel baseline, and what the offer-curve sentence promises.",
      "D or E: toggle Active only, try both sort directions, select All cities, submit the ZIP already shown in the search box, and read the page title.",
      "F: choose Phoenix, then compare the map caption, table ranks, swatches, intensity words, and selected-row detail.",
      "G: open Maple or Peachtree and read Buyer demand beside Price recommendation.",
      "H: open Rio Grande and inspect every comp's city, then scan all section headings on the page.",
      "I: open South Blvd and compare demand with feedback; then search its box serial from Listings with All cities selected.",
    ],
  },
  {
    title: "Level 3 · Strong tells",
    description: "Near-spoilers when a pair is truly stuck.",
    hints: [
      "Market says 24.6% and 91 days; Conversions says 28.0% and 13 days for the same metric names.",
      "Maple has 24 showings, 0 offers, and still says On track.",
      "Conversions labels the middle card Offer to close but repeats 28.0% showing-to-offer data.",
      "Active only still leaves Sold rows. Days to offer Asc puts larger values first.",
      "Search 85016. Also read “Browse lisitngs” aloud.",
      "After choosing Phoenix, the caption says 32 ZIPs remain on the map while only 4 are in the table. Rank 1's dark swatch is labeled Low.",
      "High-demand Maple and Peachtree recommend Cut $25,000. The recommendation label is misspelled.",
      "Rio Grande's comps include Dallas. Listing detail also has two different sections both titled Comps.",
      "South Blvd says High demand beside about 67% negative feedback. Searching LBX-CLT-0088 with All cities selected returns two listings.",
    ],
  },
] as const;

export function LabOneHints() {
  const [openLevels, setOpenLevels] = useState<number[]>([]);

  function toggleLevel(index: number) {
    setOpenLevels((current) =>
      current.includes(index) ? current.filter((level) => level !== index) : [...current, index],
    );
  }

  return (
    <section className="panel space-y-4 p-6">
      <div>
        <p className="kicker">Optional help</p>
        <h2 className="section-title mt-1">Need a hint?</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Start with Level 1. Open stronger hints only if your pair is still stuck.
        </p>
      </div>

      <div className="space-y-3">
        {HINT_LEVELS.map((level, index) => {
          const isOpen = openLevels.includes(index);
          const panelId = `lab-one-hint-${index + 1}`;

          return (
            <div key={level.title} className="surface-inset overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleLevel(index)}
              >
                <span>
                  <span className="block text-sm font-semibold">{level.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">{level.description}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-[var(--accent)]">
                  {isOpen ? "Close" : "Open"}
                </span>
              </button>

              {isOpen ? (
                <div id={panelId} className="border-t border-[var(--line)] px-4 py-4">
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
                    {level.hints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
