# Lab 3: write tests

Timebox: 45 to 60 minutes.

Write tests for the **same** RAW ticket you fixed in Lab 2. Do not use a bonus ticket unless you never had a main one.

Set the Cursor chat to **Agent**, not Plan or Ask.

Do not push. Do not deploy. Tests run on your laptop, not on the shared demo site.

## Links

- This lab: https://lockbox-status-intelligence.vercel.app/workshop/lab-3
- Lab 2: https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- Repo: https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

## 1. Confirm Lab 2 is still open

You are ready when all three are true:

1. Cursor **File > Open Folder** is on the clone root (`Lockbox-Status-Intelligence`), not a parent folder.
2. http://127.0.0.1:3000 (or 3001) shows the Throughline Market page.
3. You have your main key written down (`RAW-NN`).

> **Expected:** Localhost loads. You know your ticket key.

If the Market page is down, from the clone root run:

```bash
npm run dev
```

If you never cloned, or `npm run dev` will not start, go back to [Lab 2](https://lockbox-status-intelligence.vercel.app/workshop/lab-2) steps 1 and 3, or raise a hand. Do not start writing tests until localhost loads.

No ticket? Ask your facilitator for a backup RAW key, then use that key for the rest of this lab.

## 2. Install Chromium (skip if it hangs)

From the clone root:

```bash
npx playwright install chromium
```

If this hangs for more than 2 minutes, stop it. You can still finish by writing the spec file.

> **Expected:** Chromium installs, or you skip it and keep going.

## 3. Pick one prompt path

Look at your ticket. Choose **one** row:

| If the ticket is about… | Do this |
| --- | --- |
| A formula, rate, comparable-listing math, or demand math | `/write-unit-tests`, then `/write-e2e-tests`. You need **both** a `tests/unit/` file and a `tests/e2e/` file. |
| Anything you click or read on the page (filters, search, sort, labels, headings, copy, chips, tooltips, layout) | `/write-e2e-tests` only. You need a `tests/e2e/` file. |

If slash commands do not load, paste the matching file into chat:

- `.github/prompts/write-unit-tests.prompt.md`
- `.github/prompts/write-e2e-tests.prompt.md`

Then tell the agent:

1. Your main key (`RAW-NN`). If Jira MCP fails, paste the ticket from RAW.
2. Specs must use relative paths (`/` or `/listings`), never the Vercel URL.
3. Follow `tests/unit/example-format.test.ts` and `tests/e2e/smoke.spec.ts`.

The agent writes the files. You do not need to author Playwright by hand.

## 4. Run what you can

Run commands from the clone root (the folder with `package.json`).

If you wrote a unit file:

```bash
npx vitest run
```

If Chromium installed, run your new spec (use the filename the agent created):

```bash
npx playwright test tests/e2e/YOUR_FILE.spec.ts
```

A red test is a valid finish if the Lab 2 fix is still incomplete. Do not rewrite the app just to get green.

> **Expected:** You have a new spec file. You tried to run it, or you skipped the run because Chromium never installed.

### If this did not work

- Chat flipped to Plan: switch back to Agent, or paste the prompt file again.
- Playwright cannot find a browser: the spec file still counts. Do not keep retrying the download.
- The spec uses the Vercel URL: tell the agent to use `page.goto("/")` (or `/listings`). Never hardcode `lockbox-status-intelligence.vercel.app`.
- `npx playwright test` fails with "not found": you are not in the clone root. `cd` into `Lockbox-Status-Intelligence` and retry.
- Localhost is on port 3001, macOS/Linux/Git Bash: `PLAYWRIGHT_PORT=3001 npx playwright test tests/e2e/YOUR_FILE.spec.ts`. Windows PowerShell: `$env:PLAYWRIGHT_PORT=3001; npx playwright test tests/e2e/YOUR_FILE.spec.ts`

## Done when

- A new file exists under `tests/e2e/` that exercises your **main** ticket (not a bonus ticket).
- If you used the formula row above, a new file also exists under `tests/unit/` with `// AC:` comments.
- You tried `npx playwright test` on your spec, **or** you skipped because Chromium would not install.
- You did not push or deploy.

Stop when those are true. That is a complete Lab 3.
