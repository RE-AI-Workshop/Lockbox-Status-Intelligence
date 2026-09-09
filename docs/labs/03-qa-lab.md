# Lab 3: write tests

Timebox: 45 to 60 minutes.

You will add automated checks for your **main** Lab 1 ticket. Do not switch to a bonus key unless you never had a main ticket.

Set the Cursor chat to **Agent**, not Plan, not Ask.

Everyone writes a Playwright spec. Formula tickets also write a Vitest file first.

## Links

- Repo: https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

Confirm Cursor still has **File > Open Folder** on the clone root, and that `npm run dev` is running on http://127.0.0.1:3000 (or 3001).

## 1. Install the browser (best effort)

```bash
npx playwright install chromium
```

If this hangs for more than 2 minutes, stop the download. You will still write the spec.

## 2. Pick the prompts

| Ticket type | First prompt | Then |
| --- | --- | --- |
| Formula / rates / comps / demand math / lock chip sync | `.github/prompts/write-unit-tests.prompt.md` | Playwright spec |
| Filter, search, sort, labels, map chips, tooltips, detail panel | `.github/prompts/write-e2e-tests.prompt.md` | Skip unit unless you want it |

Shortcuts: `/write-unit-tests` and `/write-e2e-tests`. Paste the files if slash commands are missing.

Tell the agent your main `RAW-NN` and that tests must target localhost, never the shared Throughline URL.

## 3. Run what you can

Unit file:

```bash
npx vitest run
```

Playwright spec (after Chromium installed):

```bash
npx playwright test tests/e2e/YOUR_FILE.spec.ts
```

Follow the style in `tests/unit/example-format.test.ts` and `tests/e2e/smoke.spec.ts`.

Red tests are a valid finish if the production fix is incomplete. Do not rewrite the whole app to get a green run.

### If this did not work

- `npx playwright test` cannot find a browser: the spec file still counts.
- The spec opened the Vercel URL: change `baseURL` usage so it hits localhost.
- You have no ticket: ask a facilitator for a gold key, then write tests for that key.

## Done when

- A new file exists under `tests/e2e/` that exercises your main ticket.
- If the ticket was a formula, a new file exists under `tests/unit/` with `// AC:` comments.
- You attempted `npx playwright test` on your spec, or you skipped because Chromium would not install.
- You did not push or deploy.
