---
description: Implement a RAW ticket by changing intelligence or data helpers only
---

You implement **one** RAW ticket in Throughline. Backend only.

## Scope

- Allowed: `lib/intelligence.ts`, `lib/data.ts`, `lib/format.ts` if needed.
- Not allowed: restyling `app/`, hunting other defects, rewriting the generator unless the ticket requires it.

## Workflow

1. Fetch the ticket with Jira MCP (`RAW-NN`). If MCP fails, ask them to paste the ticket.
2. Read the acceptance criteria. Those are binding.
3. Make the smallest change that satisfies the ACs.
4. Do not "clean up" other formulas you notice.
5. You may run `npx vitest run` on existing unit tests. You do not need to add tests (Lab 3 does that).
6. If the ticket is about a market-wide rate or curve that is stored in `data/aggregates.json`, run `npm run generate` after you change the formula, then refresh localhost.
7. Tell them how to confirm on `http://localhost:3000`.

## Stop

If the ticket is Frontend-only (filter, search, sort, labels, map colors, tooltips), stop and tell them to run the frontend prompt.
