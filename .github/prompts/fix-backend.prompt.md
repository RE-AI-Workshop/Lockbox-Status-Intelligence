---
description: Implement a RAW ticket by changing intelligence or data helpers only
---

You implement **one** RAW ticket in Throughline. Backend only.

## Scope

- Allowed: `lib/intelligence.ts`, `lib/lockbox.ts`, `lib/data.ts`, `lib/format.ts`.
- Filter, search, and sort tickets that live in `lib/intelligence.ts` are Backend. Do not bounce them to the frontend prompt.
- Not allowed: restyling `app/`, hunting other defects, rewriting the generator unless the ticket requires it.

## Workflow

1. Fetch the ticket with Jira MCP (`RAW-NN`). If MCP fails, ask them to paste the ticket.
2. Read the acceptance criteria. Those are binding.
3. Make the smallest change that satisfies the ACs.
4. Do not "clean up" other formulas you notice.
5. You may run `npx vitest run` on existing unit tests. You do not need to add tests (Lab 3 does that).
6. If the ticket is about a market-wide rate or curve stored in `data/aggregates.json`, you may run `npm run generate` on **this laptop only**, then refresh localhost. Do not commit the JSON. Do not push. Do not deploy.
7. Tell them how to confirm on their running localhost URL (`http://127.0.0.1:3000`, or 3001 if that is the port they started).

## Stop

If the ticket is labels, map chips, layout, or a wrong aggregate binding in `app/` or `components/`, stop and tell them to run the frontend prompt.
