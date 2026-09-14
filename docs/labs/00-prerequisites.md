# Prerequisites

Do this before Lab 1 if you can. About 10 to 15 minutes.

By the end, you should be able to open Throughline, click **Create** on the RAW board, and either talk to Jira through Cursor or know you will paste a ticket by hand.

Set the Cursor chat to **Agent**, not Plan or Ask.

You do **not** need the GitHub repo for Lab 1. Clone is optional homework for Lab 2, at the bottom of this page.

## Links

- Throughline: https://lockbox-status-intelligence.vercel.app
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Token help: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/
- Repo (Lab 2 and Lab 3 only): https://github.com/RE-AI-Workshop/Lockbox-Status-Intelligence

## Required for Lab 1

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

### 4. Create an API token

1. Open the token page. Sign in with the same Atlassian account that can see RAW.
2. Create a token and copy it once. You will not see it again.

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
- If Cursor never calls a Jira tool after 2 minutes, skip MCP for now. Lab 1 still counts if you create the issue in the RAW UI by hand.

You are ready for Lab 1.

---

## Optional: clone before Lab 2 (devs and QA)

Skip this block if you do not have Node **20** or newer, or if you are only doing Lab 1 today. Lab 2 still walks through clone and `npm install`. Doing it now only saves clock time.

Do **not** open application source and hunt bugs. Lab 1 is a look-at-the-live-site lab.

1. Confirm Node:

```bash
node -v
```

> **Expected:** `v20` or newer. If you are on 16 or 18, stop here. Pair in Lab 2. Do not spend this homework installing Node.

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

- Port 3000 busy: `npm run dev -- --port 3001`.
- `npm install` fails or hangs more than a couple of minutes: stop. Pair in Lab 2. Do not chase wifi certificates.
- Do not run `npm run generate`. Do not push. Do not deploy.

Leave Playwright Chromium for Lab 3. That download is optional even then.
