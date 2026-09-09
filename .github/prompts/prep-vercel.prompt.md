---
description: Prep the Throughline repo for Vercel deployment (human connects Vercel to GitHub)
---

You are preparing **Throughline** for production on Vercel. A human will connect the GitHub repo in the Vercel dashboard. Your job is to make the branch deploy-ready and document what they need to click.

## Scope

- Allowed: verify build, fix deploy blockers, ensure `.gitignore` and committed files are correct, update `docs/deploy-vercel.md` and README deploy notes if needed, suggest a commit message.
- Not allowed: connect Vercel yourself, add secrets the app does not need, run `npm run generate`, fix planted workshop bugs, commit `docs/facilitator/`, `.cursor/mcp.json`, `.env`, `.next`, or `.vercel`.

## Before you change anything

1. Run `npm run build`. It must pass with no errors.
2. Run `npm test`. Vitest should pass.
3. Confirm these are **gitignored** and not staged: `docs/facilitator/`, `.cursor/mcp.json`, `.env`, `.next`, `.vercel`, `node_modules`.
4. Confirm `data/aggregates.json` and `data/explore.json` are **tracked in git** and will be pushed (imported in `lib/data.ts`; do not regenerate).
5. Confirm application code is **committed and pushed** to GitHub before the human deploys. Vercel builds from the remote branch, not your laptop.

## Do not regenerate market data

**Never run `npm run generate` for a Vercel prep.** Lab 1 depends on fixed counts (homepage showing-to-offer **24.6%**, Conversions **28.0%**, 50k listings). Regenerating will change those numbers.

## Vercel settings (tell the human)

When they import the repo in Vercel:

| Setting | Value |
| --- | --- |
| Framework Preset | **Next.js** (auto-detected) |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` (default) |
| Output Directory | **Leave empty** (default). Do not set to `.next` or `out`. Vercel uses the Next.js builder. |
| Install Command | `npm install` (default) |
| Node.js Version | **20.x** (matches `.nvmrc` and `package.json` `engines`) |

**Environment variables:** none required for this demo. No database, no API keys in the app. Do not add `JIRA_API_TOKEN` or other workshop secrets to Vercel.

**Production branch:** `main` (or whichever branch the team agrees to deploy).

## Repo checklist (must be true before push)

- [ ] `npm run build` succeeds locally
- [ ] `npm test` succeeds
- [ ] App source, `data/`, `docs/labs/`, `.github/prompts/`, `.cursor/commands/`, `public/`, config files are tracked and pushed
- [ ] No secrets, facilitator answer key, or local MCP config in the commit
- [ ] `.gitignore` includes `.next`, `.vercel`, `.env*`, `docs/facilitator/`, `.cursor/mcp.json`
- [ ] `next.config.ts` does not require env vars at build time

## After the human deploys

1. Copy the production URL (e.g. `https://throughline-….vercel.app`).
2. Replace `https://<THROUGHLINE_URL>` everywhere it appears (repo grep). At minimum:
   - `README.md`
   - `docs/labs/README.md`
   - `docs/labs/00-prerequisites.md`
   - `docs/labs/01-jira-lab.md`
   - Facilitator desktop pack if they use it (outside repo; not in git)
3. Smoke-test production: `/`, `/conversions`, `/demand`, `/listings`, `/boxes`, `/workshop`.
4. Tell attendees Lab 1 uses the Vercel URL; Lab 2 and 3 stay local only.

## If build fails on Vercel but passes locally

- Check Node version is 20+ in Vercel project settings.
- Ensure `data/explore.json` and `data/aggregates.json` are in the repo (not gitignored).
- Read the Vercel build log; fix TypeScript or import errors only. Do not refactor unrelated code.

## Output for the human

When done, print:

1. **Ready to push?** yes/no and what is still blocking
2. **Files changed** (if any)
3. **Suggested commit message** (if they asked for a commit)
4. **Vercel import steps** (link to `docs/deploy-vercel.md`)
5. **Post-deploy checklist** (URL swap + smoke test)

Do not push or create a Vercel project unless they explicitly ask.
