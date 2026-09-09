# Deploy Throughline to Vercel

Throughline is a standard Next.js 15 app. No database or environment variables are required for the demo.

## Who does what

| Role | Task |
| --- | --- |
| **You (Vercel admin)** | Connect GitHub, import repo, deploy production |
| **Agent / developer** | Run `/prep-vercel` or `.github/prompts/prep-vercel.prompt.md` before push; fix build blockers |

## One-time Vercel setup

**Prerequisite:** Application code is pushed to GitHub (`main`). Vercel builds from the remote repo, not your local machine.

1. Log in to [Vercel](https://vercel.com) with access to the **RE-AI-Workshop** GitHub org (or the repo owner).
2. **Add New… → Project** → import [Lockbox-Status-Intelligence](https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence).
3. Confirm settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js (auto-detected) |
| Root Directory | `.` |
| Build Command | `npm run build` |
| Output Directory | Leave empty (default). Do not set `.next` or `out`. |
| Install Command | `npm install` |
| Node.js Version | 20.x (matches `.nvmrc` and `package.json` `engines`) |

4. **Environment Variables:** leave empty (none needed).
5. Deploy production from `main`.

If the first deploy fails, open the build log. Fix errors locally, push, and redeploy.

## Before the first deploy (repo side)

From the repo root:

```bash
npm install
npm run build
npm test
```

Do **not** run `npm run generate` before the workshop. Committed `data/aggregates.json` and `data/explore.json` must stay as-is.

**Do not commit:** `docs/facilitator/`, `.cursor/mcp.json`, `.env`, `.next`, `.vercel`.

## After deploy

**Production URL:** https://lockbox-status-intelligence.vercel.app

Lab docs and README already point at this URL. If you change the Vercel domain, grep the repo for `lockbox-status-intelligence.vercel.app` and update.

Smoke-test:
   - `/` — Market KPIs and watchlist
   - `/conversions`
   - `/demand`
   - `/listings`
   - `/boxes`
   - `/workshop` — Lab 1 instructions

## Redeploys

Each push to the production branch triggers a new deployment. Workshop attendees should **not** deploy during Lab 2 or Lab 3; they run locally only.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Build fails on Node version | Set Node **20.x** in Vercel → Project → Settings → General |
| Missing data at runtime | Ensure `data/aggregates.json` and `data/explore.json` are committed |
| 404 on routes | Confirm Framework Preset is Next.js, not Static Export |
| Wrong KPI numbers on live site | Someone ran `npm run generate`; restore committed JSON from git |

## Agent prep

In Cursor Agent chat:

```
/prep-vercel
```

Or paste the contents of `.github/prompts/prep-vercel.prompt.md`.
