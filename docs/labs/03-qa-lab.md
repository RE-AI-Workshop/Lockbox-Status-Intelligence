# Lab 3: write tests

Timebox: 45 to 60 minutes.

Add automated checks for the **same** RAW ticket you fixed in Lab 2. Your tests should prove the fix still holds. Do not switch to a bonus ticket unless you never had a main one.

Set the Cursor chat to **Agent**, not Plan or Ask.

Everyone writes a Playwright spec. If your ticket was about a formula or rate, write a Vitest file first.

## Links

- This lab: https://lockbox-status-intelligence.vercel.app/workshop/lab-3
- Lab 2: https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- Repo: https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

Before you start: Cursor should still have **File > Open Folder** on the repo root, and `npm run dev` should still be running on http://127.0.0.1:3000 (or 3001).

## 1. Install Chromium (best effort)

```bash
npx playwright install chromium
```

If this hangs for more than 2 minutes, stop the download. You can still write the spec file.

> **Expected:** Playwright downloads a browser, or you move on without it. Either way, keep writing tests.

## 2. Choose your prompts

| Your ticket was about… | Start with | Then |
| --- | --- | --- |
| A formula, rate, comps, demand math, or lock chip sync | `.github/prompts/write-unit-tests.prompt.md` | Playwright spec |
| Filters, search, sort, labels, map chips, tooltips, detail panel | `.github/prompts/write-e2e-tests.prompt.md` | Unit tests optional |

Shortcuts: `/write-unit-tests` and `/write-e2e-tests`.

Tell the agent your main `RAW-NN`. Tests must hit **localhost**, never the shared Vercel URL.

## 3. Run what you can

Unit tests:

```bash
npx vitest run
```

Your Playwright spec (after Chromium is installed):

```bash
npx playwright test tests/e2e/YOUR_FILE.spec.ts
```

Follow the style in `tests/unit/example-format.test.ts` and `tests/e2e/smoke.spec.ts`.

A red test is a valid finish if the fix from Lab 2 is still incomplete. Do not rewrite the whole app just to get green.

### If this did not work

- Playwright cannot find a browser: the spec file still counts.
- The spec hits the Vercel URL: change it to use localhost.
- No ticket: ask your facilitator for a backup RAW ticket key, then write tests for that key.

## Done when

- A new file exists under `tests/e2e/` that exercises your main ticket.
- If the ticket was a formula, a new file exists under `tests/unit/` with `// AC:` comments.
- You tried `npx playwright test` on your spec, or you skipped because Chromium would not install.
- You did not push or deploy.
