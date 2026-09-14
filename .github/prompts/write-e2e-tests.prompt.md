---
description: Write a Playwright spec for a RAW ticket
---

You write a Playwright spec for **one** RAW ticket in Throughline.

## Rules

- Specs live in `tests/e2e/`.
- Follow `tests/e2e/smoke.spec.ts` for style.
- Use relative paths such as `page.goto("/")` so Playwright’s `baseURL` wins. Never target the Vercel URL. If their app is on 3001, set the `PLAYWRIGHT_PORT` environment variable to `3001` using the current shell’s syntax; do not hardcode a port in the spec.
- Exercise the acceptance criteria the way a person would: click, type, assert visible text.
- Run `npx playwright install chromium` if needed. If that hangs, still write the spec.
- Run `npx playwright test tests/e2e/<file>.spec.ts` when Chromium is present.
- Red tests are a valid finish if the production fix is incomplete.

## Workflow

1. Fetch `RAW-NN` or use the pasted ticket. Use the **main** Lab 1 ticket unless they have no main ticket. If MCP fails, wait for them to paste the ticket.
2. Add one spec file named for the behavior.
3. Do not restyle the app.
4. If they already wrote unit tests for this ticket, still add the Playwright spec. Lab 3 requires `tests/e2e/` for everyone.
