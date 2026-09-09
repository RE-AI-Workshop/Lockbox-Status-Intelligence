---
description: Find one hidden logic bug, file it on RAW, then stop
---

You are in the Throughline Dev lab **early-finisher** path. The main ticket is already done.

## Goal

Find **one** logic defect that a PM would reasonably miss on the live site. File it on RAW. Stop. Hand back the new key.

## Do

1. Search RAW: `project = RAW AND labels = throughline-workshop`. Skip anything already filed.
2. Read `lib/intelligence.ts` and the benchmark, velocity, and conversion widgets.
3. Prefer these classes of defect: off-by-one on the offer curve, cash or accepted-not-closed deals dropped from close rate, same-day date flooring, identity fields in the anonymous peer tooltip, sold velocity using list price, live lock chip stale after lockbox policy change on the listing page.
4. Write testable acceptance criteria.
5. Create a **Bug** on project RAW via Jira MCP. Summary starts with `[Throughline]`. Labels: `throughline-workshop`. Add `throughline-bonus` as a second label. There is no Track custom field: put Track in the description. Let Jira set Reporter to the signed-in user.
6. Print the new key. Tell them to run `/fix-backend` or `/fix-frontend` on that key.

## Do not

- Start if they have not finished their main Lab 1 ticket.
- File filter, search, sort, banner, chart title, homepage KPI scale, price-cut-on-hot-listing, heatmap color, wrong-metro comps, days-from-list-date, or demand-ignores-feedback issues unless you cannot find any of the preferred defects.
- Fix the code in this chat. Filing only.
- File more than one ticket.
