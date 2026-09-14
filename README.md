# Throughline

A sample market of 50,000 listings. It shows whether showings turn into offers and closes, and whether the lockbox should still open.

This repo is the **workshop demo**. There is no login, no database, and no live lockbox API. Each listing has a mock box you can lock, set quiet hours on, or turn off by hand. Desktop browsers only.

## Start here

| If you are here to… | Do this |
| --- | --- |
| See the product | Open the [live app](https://lockbox-status-intelligence.vercel.app). You do not need to clone. |
| Take the SentriLock workflow | Download [share/SentriLock-Workflow-Kit.zip](share/SentriLock-Workflow-Kit.zip). Unzip it and read **that** folder’s `README.md`. |
| Do the workshop labs | Use the live app for Lab 1. Clone this repo only for Lab 2 and Lab 3. Lab docs: [docs/labs/README.md](docs/labs/README.md). |

The zip is a reusable ticket-to-handoff workflow for VS Code Copilot and Cursor. Configure it per SentriLock repository. It is not installed in Throughline and does not replace the labs.

## What the app shows

| Page | What it is |
| --- | --- |
| Market | Conversion snapshot and a five-home watchlist |
| Conversions | Showing → offer → close |
| Demand | Buyer interest across the sample |
| Listings | Browse the market; open a listing for its box |
| Boxes | Open, auto-locked on Pending/Sold, quiet hours, manual off |
| Workshop | Lab pages (footer link) |

Live app: https://lockbox-status-intelligence.vercel.app

## Workshop labs

Three labs, in order, about 45–60 minutes each. Pair if you want; stay on your own laptop if you can.

Fixes stay **local**. Do not push or redeploy the shared demo.

| Lab | You use | Skip until later |
| --- | --- | --- |
| Lab 1 | Live site, Cursor, Jira | This GitHub repo |
| Lab 2 | This repo on your machine | A deploy |
| Lab 3 | Same local repo + your Lab 1 ticket | A deploy |

- Lab 1: https://lockbox-status-intelligence.vercel.app/workshop
- Lab 2: https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- Lab 3: https://lockbox-status-intelligence.vercel.app/workshop/lab-3
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

## Run locally (Lab 2 and Lab 3)

Node **20.19+** is recommended (see `.nvmrc`). Node 22 requires 22.12+; Node 24+ also works.

```bash
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
cd Lockbox-Status-Intelligence
npm install
npm run dev
```

Open http://127.0.0.1:3000. If Throughline is already running there, reuse it. If another app owns that port, run `npm run dev -- --port 3001`.

Same commands work in Windows PowerShell.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` | Production build |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright (needs Chromium) |
| `npm run generate` | Rebuild market JSON — only if a ticket changes a stored formula |

## Jira in Cursor

Lab 1 does not need a clone. Follow [docs/labs/00-prerequisites.md](docs/labs/00-prerequisites.md): Cursor **Settings → MCP**, paste the JSON, then smoke-test `List issues in project RAW`.

After you clone for Lab 2, you can instead copy `.cursor/mcp.json.example` to `.cursor/mcp.json`. Never commit the filled file.

## Deploy

A human connects this repo in Vercel. Do not deploy over the shared demo during the labs. Setup: [docs/deploy-vercel.md](docs/deploy-vercel.md).
