# Throughline agent guide

Throughline is a workshop demo: a lockbox status desk over a sample market of 50,000 listings. There is no login, no database, and no live lockbox API. Each listing has a mock box.

Fixes stay on this laptop. Do not push. Do not deploy. Do not change the shared site at https://lockbox-status-intelligence.vercel.app.

## Stack

Next.js (App Router) + React + TypeScript. Node **20.19+** (see `.nvmrc`). Node 22 needs 22.12+; Node 24+ also works.

| Path | Role |
| --- | --- |
| `app/`, `components/` | Visible UI |
| `lib/intelligence.ts`, `lib/lockbox.ts`, `lib/data.ts`, `lib/format.ts` | Formulas, filters, search, sort, lockbox policy |
| `data/` | Generated market JSON. Do not hand-edit unless a ticket says so |
| `docs/ui-spec.md` | UI contract before changing `app/` or `components/` |
| `docs/labs/` | Workshop labs |
| `.github/prompts/` | Ticket-scoped prompts (prefer the matching `/slash` command) |
| `share/SentriLock-Workflow-Kit/` | Reusable kit to copy into a SentriLock repo. Not installed here |

Product name is **Throughline**. Do not rename it. Do not add auth. Do not add a live lockbox API. Do not restyle the product or invent a new look.

## Ticket work

Implement **one** RAW ticket at a time. Acceptance criteria on the ticket are binding. Smallest change that satisfies them. Do not hunt other planted bugs unless the person asked for `/find-bonus-bug`.

Fetch `RAW-NN` with Jira MCP. If MCP fails, ask them to paste the ticket. Never commit `.cursor/mcp.json` or tokens.

| Track | Change | Prompt |
| --- | --- | --- |
| Backend | `lib/intelligence.ts`, `lib/lockbox.ts`, `lib/data.ts`, `lib/format.ts` | `/fix-backend` |
| Frontend | `app/`, `components/` | `/fix-frontend` |

Filter, search, and sort that live in `lib/intelligence.ts` are Backend. Labels, map chips, layout, and wrong aggregate bindings in `app/` or `components/` are Frontend.

Run `npm run generate` only when a ticket changes a rate or curve stored in `data/aggregates.json`, and only on this laptop. Do not commit the JSON.

## Local app

```bash
npm install
npm run dev
```

Use http://127.0.0.1:3000. Reuse a healthy Throughline server already on 3000. Stop a broken one before restarting. Use `npm run dev -- --port 3001` only when another app owns 3000.

| Command | Use |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` | Production build |
| `npx vitest run` | Unit tests |
| `npx playwright test tests/e2e/<file>.spec.ts` | One e2e spec |
| `npm run generate` | Rebuild market JSON — ticket-required only |

## Tests

Do not add tests during a fix unless a heading change would break `tests/e2e/smoke.spec.ts`. Lab 3 owns new specs.

- Unit: `tests/unit/`, follow `tests/unit/example-format.test.ts`, label cases with `// AC:`.
- E2E: `tests/e2e/`, follow `tests/e2e/smoke.spec.ts`. Use relative paths (`page.goto("/")`). Never hardcode the Vercel URL. Port 3001: set `PLAYWRIGHT_PORT=3001` in the shell, not in the spec.
- Formula / rate tickets need both a unit file and an e2e file. Click-or-read tickets need e2e only.
- Name files for the behavior, not the ticket key. Red tests are a valid finish if the production fix is incomplete.

The smoke spec currently expects the misspelled Listings heading (`Browse lisitngs`). If the ticket is that typo, update the spec in the same change.

## Frontend verification

After a visible UI change, follow `.github/ai/FE_PLAYWRIGHT.md`. Click the flow on localhost. A screenshot or “I updated the JSX” is not done. If Playwright MCP is missing, ask the person to click it.

## SentriLock workflow kit

`share/SentriLock-Workflow-Kit/` is cargo. It is not wired into Throughline and does not replace the labs. See `share/README.md`.

Do not run the kit pipeline in this repo. There is no `active-brief.md`, no workflow extension, and no `/intake-agent`. Workshop commands stay `/fix-backend`, `/fix-frontend`, `/write-unit-tests`, and `/write-e2e-tests`. Do not follow the kit’s vault `AGENTS.md` here — those rules are for a live SentriLock API.

If you are **editing the kit itself**:

- Do not rename prompt, brief, template, or `agent-errors/` files unless you also update the extension and its tests.
- Brief table wording (`✅ Complete`, `## Step N Summary`) is a parser contract. Do not restyle it.
- Per-project facts belong in that repo’s `.github/ai/PROJECT.md` after install, not in Throughline.
- Do not add a filled `.env.local` or `mcp.json` before sharing the kit.
