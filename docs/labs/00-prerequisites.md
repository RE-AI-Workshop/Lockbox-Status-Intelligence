# Prerequisites

Do this before Lab 1 if you can. The required path takes about 5 minutes. Jira-in-Cursor setup may take another 5 to 10.

By the end, you should be able to open Throughline and click **Create** on the RAW board. Connecting Jira to Cursor is recommended, but the RAW Create screen is a complete fallback.

Set the Cursor chat to **Agent**, not Plan or Ask.

You do **not** need Node or the GitHub repo for Lab 1. Clone is optional homework for Lab 2, at the bottom of this page.

## Links

- Throughline: https://lockbox-status-intelligence.vercel.app
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Token help: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
- Repo (Lab 2 and Lab 3 only): https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence

## Minimum setup for Lab 1

### 1. Cursor and a desktop browser

1. Install [Cursor](https://cursor.com) if you do not already have it.
2. Use a desktop browser (Chrome, Edge, Firefox, or Safari). The demo is not built for phones.

### 2. Open Throughline

Open https://lockbox-status-intelligence.vercel.app. You should see the Market page.

> **Expected:** The live app loads. You do not need an account.

### 3. Confirm you can file on RAW

1. Open the RAW board link above. Use the Sentrilock invite to `dconroy.atlassian.net`, not a NAR Jira site.
2. Click **Create**.

> **Expected:** A create-issue form opens. If you can view the board but do not see **Create**, raise a hand. Do not spend the session fighting permissions.

If the live app loads and RAW opens a Create form, you can complete Lab 1. Continue below to file through Cursor, or skip to Lab 1 and use the RAW form manually.

---

## Recommended: connect Jira to Cursor

This path lets the Cursor agent search for duplicates and create your ticket. Stop after 2 minutes if it does not connect; do not let integration setup consume the lab.

It uses `npx`. If `npx` is unavailable, skip this section. You do not need to install Node just for Lab 1.

### 4. Create an API token

1. Open the token page. Sign in with the same Atlassian account that can see RAW.
2. Create a token and copy it once. You will not see it again.
3. Treat the token like a password. Do not paste it into chat, a Jira ticket, or a screenshot.

### 5. Add Jira to Cursor

1. In Cursor, open **Settings**, then **MCP**.
2. Add or edit a server named `jira` using the JSON below.
3. Put your Atlassian email in `JIRA_USERNAME`.
4. Put the token in `JIRA_API_TOKEN`.
5. Leave `JIRA_URL` as `https://dconroy.atlassian.net`.
6. Enable the server. Reload if Cursor asks.

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://dconroy.atlassian.net",
        "JIRA_USERNAME": "<your-email>",
        "JIRA_API_TOKEN": "<your-token>",
        "JIRA_PROJECTS_FILTER": "RAW"
      }
    }
  }
}
```

### 6. Smoke test

In an Agent chat, ask:

`List issues in project RAW`

> **Expected:** Cursor makes a Jira tool call and returns a short list of issues.

#### If this did not work

- Put the token in `JIRA_API_TOKEN`, not in `JIRA_URL`.
- Use the Atlassian email for the account that can see RAW.
- If `npx` is missing or Cursor never calls a Jira tool after 2 minutes, stop setup. Lab 1 still counts when you create the issue in the RAW UI by hand.

You are ready for Lab 1 when the live app loads and either Cursor can list RAW issues or you can open RAW's Create form.

---

## Optional: clone before Lab 2 (devs and QA)

Skip this block if you are only doing Lab 1 today. Lab 2 still walks through clone and `npm install`. Doing it now only saves clock time.

Do **not** open application source and hunt bugs. Lab 1 is a look-at-the-live-site lab.

1. Confirm Node:

```bash
node -v
```

> **Expected:** Node 20.19+ (recommended), 22.12+, or 24+. If `node` is missing or the version is older, install 20.19:

```bash
nvm install 20.19
nvm use 20.19
```

Then run `node -v` again. If you do not use nvm, install Node 20 LTS from https://nodejs.org and reopen the terminal.

2. Clone and open the repo root in Cursor (**File > Open Folder** on `Lockbox-Status-Intelligence`, not a parent folder):

```bash
git clone https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence.git
cd Lockbox-Status-Intelligence
```

Windows (PowerShell) uses the same `git clone` line.

3. Install and start once:

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000. You should see Throughline. Then stop the server (`Ctrl+C`). You will start it again in Lab 2.

> **Expected:** `npm install` finishes and the Market page loads on localhost.

#### If this did not work

- Port 3000 busy: open http://127.0.0.1:3000 first. Reuse it if Throughline is already there. Stop an old broken Throughline terminal before restarting; use `npm run dev -- --port 3001` only if another app owns port 3000.
- `npm install` fails or hangs more than a couple of minutes: stop and try again in Lab 2. Do not chase wifi certificates.
- Do not run `npm run generate`. Do not push. Do not deploy.

Leave Playwright Chromium for Lab 3. That download is optional even then.
