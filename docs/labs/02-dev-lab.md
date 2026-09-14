# Lab 2: implement the ticket

Timebox: 45 to 60 minutes.

You will clone Throughline, run it on your laptop, and fix **one** RAW ticket: the issue you filed in Lab 1, or a backup ticket key from your facilitator.

Set the Cursor chat to **Agent**, not Plan or Ask.

Do not push. Do not deploy. The shared site at https://lockbox-status-intelligence.vercel.app stays as it is.

## Links

- This lab: https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- Lab 3 (next): https://lockbox-status-intelligence.vercel.app/workshop/lab-3
- Lab 1: https://lockbox-status-intelligence.vercel.app/workshop
- Repo: https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

## 1. Open the project in Cursor

1. Clone the repo.

macOS, Linux, or Git Bash:

```bash
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
```

Windows (PowerShell):

```powershell
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
```

2. In Cursor: **File > Open Folder**. Open the clone root (`Lockbox-Status-Intelligence`), not a parent folder and not a single file inside it.

3. Check Node:

```bash
node -v
```

> **Expected:** Node 20.19+ (recommended), 22.12+, or 24+. If `node` is missing or the version is older, install 20.19:

```bash
nvm install 20.19
nvm use 20.19
```

Then run `node -v` again. If you do not use nvm, install Node 20 LTS from https://nodejs.org and reopen the terminal.

## 2. Connect Jira again (optional)

Skip this if Jira MCP already works from Cursor Settings.

1. Copy the example config:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

On Windows (PowerShell): `Copy-Item .cursor/mcp.json.example .cursor/mcp.json`

2. Add your email to `JIRA_USERNAME` and your token to `JIRA_API_TOKEN`.
3. Reload MCP if Cursor asks.

`.cursor/mcp.json` is gitignored. Never commit a token.

If MCP still fails after 2 minutes, paste your ticket from RAW into the chat and continue.

## 3. Install and run locally

While `npm install` runs, skim the next section.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000. You should see the Throughline Market page.

> **Expected:** The Market page loads on your machine. It will look like the shared site, but you are on localhost now.

### If this did not work

- Port 3000 busy: open http://127.0.0.1:3000 first. If Throughline loads, reuse it. If an old Throughline terminal is broken, stop it with `Ctrl+C` and restart. Use `npm run dev -- --port 3001` only when another app owns port 3000.
- `npm install` fails: pair on a machine that already runs. Do not debug npm for more than 2 minutes.
- Blank page: check the terminal for a compile error and raise a hand.

## 4. Fix your Lab 1 ticket

This is the main work for Lab 2.

1. Write down your Lab 1 key (`RAW-NN`). No ticket yet? Ask your facilitator for a backup RAW ticket key.
2. Open the issue in Jira. Read the acceptance criteria. Treat those as the definition of done.
3. Pick a prompt based on **Track** in the ticket description:

| Track | Open this prompt |
| --- | --- |
| Backend | `.github/prompts/fix-backend.prompt.md` |
| Frontend | `.github/prompts/fix-frontend.prompt.md` |
| Full-stack | Start with the layer your hunt suggested. The other layer is stretch. |

Shortcuts: `/fix-backend` or `/fix-frontend`. If slash commands do not load, paste the prompt file into chat.

4. Tell the agent your ticket key and that localhost is running.

**Backend** work lives in `lib/intelligence.ts`, `lib/lockbox.ts`, and data helpers. Filter, search, and sort tickets are Backend. Do not restyle the app. Do not push generated JSON.

**Frontend** work lives in `app/` and `components/`. Read `docs/ui-spec.md` first. The agent should verify in the browser when it can.

Fix only what your ticket asks for. Do not chase other bugs.

### If this did not work

- Chat flipped to Plan: switch back to Agent, or paste the prompt file again.
- Agent edited the wrong layer: stop it. Formulas go to the backend prompt. Visible UI goes to the frontend prompt.
- Not sure the fix worked: click the same path you used in Lab 1 on **localhost**, not on Vercel.
- The existing smoke test expects the misspelled Listings heading. If your ticket is that typo, update `tests/e2e/smoke.spec.ts` in the same change or wait for Lab 3.

## Done when

- Localhost matches the acceptance criteria on your main Lab 1 ticket.
- You did not push or deploy.
- You still have the RAW key for Lab 3.

Stop here if time is up. That is a complete Lab 2.

## If you finished early

Only start here after **Done when** is true for your main ticket.

1. Paste `.github/prompts/find-bonus-bug.prompt.md` (or run `/find-bonus-bug`).
2. Let the agent file **one** new RAW issue for a logic bug that is not already on the board.
3. Fix that new key with `/fix-backend` or `/fix-frontend`.
4. Stop after one bonus ticket.

If your main ticket is not done, skip this section.
