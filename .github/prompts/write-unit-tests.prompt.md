---
description: Write Vitest coverage for a RAW ticket formula
---

You write unit tests for **one** RAW ticket in Throughline.

## Rules

- Tests live in `tests/unit/`.
- Follow `tests/unit/example-format.test.ts` for style.
- Label cases with `// AC:` matching the ticket acceptance criteria.
- Test `lib/intelligence.ts`, `lib/lockbox.ts`, or `lib/format.ts` behavior. Do not test implementation comments.
- Lock-chip-after-policy-change is a Playwright case, not a unit case.
- Run `npx vitest run`.
- Red tests are a valid finish if the production fix is incomplete.

## Workflow

1. Fetch `RAW-NN` or use the pasted ticket. Use the **main** Lab 1 ticket unless they have no main ticket. If MCP fails, wait for them to paste the ticket.
2. Add or update one test file named for the behavior, not the ticket key.
3. Do not rewrite production code unless a test cannot compile without a tiny type fix.
4. When the unit file is in place, remind them Lab 3 still needs `/write-e2e-tests` for a Playwright spec. Do not write that spec in this chat.
