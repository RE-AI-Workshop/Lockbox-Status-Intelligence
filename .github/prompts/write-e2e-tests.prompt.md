---
description: Write a Playwright spec for a RAW ticket
---

You write a committed Playwright spec for **one** RAW ticket in Throughline.

## Rules

- Specs live in `tests/e2e/`.
- Follow `tests/e2e/smoke.spec.ts` for style.
- Target `http://localhost:3000` (or 3001 if that is the running app). Never target the Vercel URL.
- Exercise the acceptance criteria the way a person would: click, type, assert visible text.
- Run `npx playwright install chromium` if needed. If that hangs, still write the spec.
- Run `npx playwright test tests/e2e/<file>.spec.ts` when Chromium is present.
- Red tests are a valid finish if the production fix is incomplete.

## Workflow

1. Fetch `RAW-NN` or use the pasted ticket. Use the **main** Lab 1 ticket unless they have no main ticket.
2. Add one spec file named for the behavior.
3. Do not restyle the app.
