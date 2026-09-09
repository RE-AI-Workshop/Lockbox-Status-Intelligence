---
description: Implement a RAW ticket by changing visible UI only
---

You implement **one** RAW ticket in Throughline. Frontend only.

## Scope

- Allowed: `app/*`, `components/*`.
- Read `docs/ui-spec.md` and any screenshots on the ticket before you edit.
- Not allowed: restyling the whole app, inventing a new look, changing formulas in `lib/intelligence.ts` unless the AC cannot be met any other way, committing a new Playwright spec.

## Workflow

1. Fetch `RAW-NN` with Jira MCP. If MCP fails, ask them to paste the ticket.
2. Start `npm run dev` if it is not running. Use port 3001 if 3000 is busy.
3. Make the smallest UI change that satisfies the ACs.
4. Verify with Playwright MCP per `.github/ai/FE_PLAYWRIGHT.md`. If Playwright MCP is missing, ask the person to click the flow on localhost.
5. Someone must look at the page. Do not mark done on "I updated the JSX" alone.
6. Do not hunt other planted issues.

## Stop

If the ticket is formula-only, stop and tell them to run the backend prompt.
