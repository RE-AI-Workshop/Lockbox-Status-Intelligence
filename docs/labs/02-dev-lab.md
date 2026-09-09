# Lab 2: implement the ticket

Timebox: 45 to 60 minutes.

You will clone Throughline, run it on your laptop, and implement **one** RAW ticket: the Lab 1 issue you filed (or a gold key if a facilitator gave you one).

Set the Cursor chat to **Agent**, not Plan, not Ask.

Do not push. Do not deploy. The shared site stays as it is.

## Links

- Repo: https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Token help: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

## 1. Open the project root

1. Clone with HTTPS (macOS, Linux, or Git Bash):

```bash
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
```

Windows (PowerShell):

```powershell
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
```

2. In Cursor: **File > Open Folder**. Open the clone root (`Lockbox-Status-Intelligence`), not a parent folder, not a single file.
3. Check Node:

```bash
node -v
```

You want v20 or newer. If the version is 16 or 18, pair with someone whose `node -v` is already 20. Do not spend the lab installing Node unless a facilitator is free to help.

## 2. Optional: project MCP file

If Jira MCP already works from Settings, skip this.

1. Copy the example (macOS or Linux):

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

Windows (PowerShell):

```powershell
Copy-Item .cursor/mcp.json.example .cursor/mcp.json
```

2. Put your Atlassian email in `JIRA_USERNAME`.
3. Put your token in `JIRA_API_TOKEN`.
4. Leave `JIRA_URL` as `https://dconroy.atlassian.net`.
5. Reload MCP if Cursor asks.

`.cursor/mcp.json` is gitignored. Never commit a token.

If MCP still fails after 2 minutes, paste the ticket from RAW into the chat and keep going.

## 3. Install and run locally

Let install finish while you read the track table in the next section.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000 (or http://localhost:3000). You should see the Throughline Market page.

### If this did not work

- If port 3000 is busy:

```bash
npm run dev -- --port 3001
```

Use http://127.0.0.1:3001 for the rest of the lab.

- If `npm install` hangs or fails, pair on a machine that already runs. Do not debug the registry for more than 2 minutes.
- If the page is blank, check the terminal for a compile error and raise a hand.

## 4. Main (required): fix your Lab 1 ticket

1. Write down your Lab 1 key (`RAW-NN`). If you do not have a usable ticket, ask a facilitator for a gold key.
2. Open the issue. Read the acceptance criteria. Those are binding.
3. Pick one prompt from Track:

| Track on the ticket | Prompt to paste |
| --- | --- |
| Backend | `.github/prompts/fix-backend.prompt.md` |
| Frontend | `.github/prompts/fix-frontend.prompt.md` |
| Full-stack | Start with the layer the hunt implied. The other layer is stretch. |

Shortcut if slash commands loaded: `/fix-backend` or `/fix-frontend`. If they did not load, you opened the wrong folder, or paste the prompt file.

4. Tell the agent the ticket key and that localhost is running.

**Backend** may change `lib/intelligence.ts` and data helpers. It must not restyle the app.

**Frontend** may change `app/` and `components/`. It must read `docs/ui-spec.md` first. It should click the flow with Playwright MCP. If that MCP is missing, you click localhost yourself.

Do not hunt other defects. Do not clean up formulas that are not in the ticket.

### If this did not work

- Chat flipped to Plan: switch back to Agent, or paste the prompt file again.
- Agent edited the wrong layer: stop it. Formula tickets go to the backend prompt. Visible controls go to the frontend prompt.
- You cannot tell if the fix worked: click the same path you used in Lab 1 on localhost, not on the shared site.

## Done when

- Localhost matches the acceptance criteria on your **main** Lab 1 ticket.
- You did not push or deploy.
- You have the RAW key written down for Lab 3.

That is a complete Lab 2. Stop here if the hour is ending.

## If you finished early

Only start this section after the Done when list is true for your main ticket.

1. Paste `.github/prompts/find-bonus-bug.prompt.md` (or run `/find-bonus-bug`).
2. The agent should search RAW, pick **one** logic issue that is not already filed, and create a new RAW issue through MCP.
3. If MCP fails, take the paste-ready markdown to the RAW Create screen (Path C).
4. Run `/fix-backend` or `/fix-frontend` on that **new** key only.
5. Stop after one bonus ticket.

If you have not finished the main ticket, ignore this section.
