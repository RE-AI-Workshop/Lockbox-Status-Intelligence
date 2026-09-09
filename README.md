# Throughline

Throughline is a sample market of 50,000 listings. It shows whether showings turn into offers and closes, and whether the lockbox should still open.

This is a workshop prototype. There is no login, no database, and no live lockbox API. Each listing has a mock box. You can lock it when the listing is Pending or Sold, set quiet hours, or turn it off by hand.

## Who uses the site vs the repo

- **Lab 1** uses the live app only. Open the Throughline URL and the Workshop link in the footer. You do not need this repository yet.
- **Lab 2 and Lab 3** use this repository on your laptop. Run the app locally. Do not deploy over the shared demo.

Workshop sheets: [docs/labs/README.md](docs/labs/README.md).

## Live app

https://<THROUGHLINE_URL>

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Node 20 or newer (see `.nvmrc`)
- Vitest and Playwright for the QA lab

Desktop browsers only. This is not a mobile lab.

## Run locally

macOS or Linux, after you have Node 20:

```bash
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
cd Lockbox-Status-Intelligence
npm install
npm run dev
```

Windows (PowerShell):

```powershell
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
cd Lockbox-Status-Intelligence
npm install
npm run dev
```

Open http://localhost:3000. If port 3000 is busy:

```bash
npm run dev -- --port 3001
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` | Production build |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright (needs Chromium) |
| `npm run generate` | Rebuild `data/aggregates.json` and `data/explore.json` |

You should not need `npm run generate` unless a ticket changes a market-wide formula that is stored in those files.

## Jira MCP

Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and add your Atlassian email and API token. Never commit the real file.
