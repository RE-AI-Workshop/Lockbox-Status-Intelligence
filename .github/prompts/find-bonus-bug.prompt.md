---
description: Find one hidden logic bug, file it on RAW, then stop
---

You are in the Throughline Dev lab **early-finisher** path. The main ticket is already done.

## Goal

Find **one** logic defect that a PM would reasonably miss on the live site. File it on RAW. Stop. Hand back the new key.

## Do

1. Search RAW: `project = RAW AND labels = throughline-workshop`. Skip anything already filed.
2. Read `lib/intelligence.ts`, `lib/lockbox.ts`, Market Signals, and the generator logic behind claims you inspect.
3. Prefer defects a Lab 1 pair would miss: quiet-hours counted as open, the unsupported “cash deals close faster” claim, duplicate lockbox serials, same-day days-to-offer clamped to 1 on 14 Brazos St, or sold velocity using list price on a Dallas Sold listing.
4. Write testable acceptance criteria.
5. Create a **Bug** on project RAW via Jira MCP. Summary starts with `[Throughline]`. Labels: `throughline-workshop`. Add `throughline-bonus` as a second label. There is no Track custom field: put Track in the description. Let Jira set Reporter to the signed-in user.
6. Print the new key. Tell them to run `/fix-backend` or `/fix-frontend` on that key.

## Do not

- Start if they have not finished their main Lab 1 ticket.
- File filter, search, sort, banners, homepage KPI scale, price-cut-on-hot-listing, inverted intensity labels, wrong-metro comps, duplicate Comps headings, stale lock chips, or demand-ignores-feedback unless you cannot find any of the preferred defects.
- Fix the code in this chat. Filing only.
- File more than one ticket.
