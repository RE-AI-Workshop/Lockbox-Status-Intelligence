# Lab 1: file one ticket

Timebox: 45 to 60 minutes.

This is a human hunt. You look at the live site, write up what is wrong, and file **one** RAW ticket. Walk out with an issue key like `RAW-42`.

You do not need the GitHub repo for this lab.

Set the Cursor chat to **Agent**, not Plan or Ask.

## Links

- Throughline: https://lockbox-status-intelligence.vercel.app
- This lab in the browser: https://lockbox-status-intelligence.vercel.app/workshop
- Lab 2 (next): https://lockbox-status-intelligence.vercel.app/workshop/lab-2
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- API token: https://id.atlassian.com/manage-profile/security/api-tokens

The workshop page has the same setup steps and create-ticket prompt if you prefer to stay in the browser.

## Set up Jira in Cursor (if you have not yet)

Skip this block if prerequisites already worked.

1. Open the RAW board and confirm you can click **Create**.
2. Create an Atlassian API token and copy it once.
3. In Cursor **Settings > MCP**, add a `jira` server with the JSON below.
4. Put your email in `JIRA_USERNAME` and the token in `JIRA_API_TOKEN`.
5. In Agent chat, ask `List issues in project RAW`.

> **Expected:** Cursor calls Jira and returns a short issue list. If MCP fails after 2 minutes, you can still finish Lab 1 by creating the issue in the RAW UI (see Path C below).

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

## 1. Pick a hunt zone

Your facilitator may assign a letter. Start on that page or control. If someone already filed the obvious bug in your zone, look for a second tell or try the next letter.

| Zone | Where to start |
| --- | --- |
| A | Market home page: KPI row and Signals |
| B | Market watchlist: the five home cards |
| C | Conversions: the three rate cards |
| D | Listings: City filter, Active only, Days to offer sort |
| E | Listings: Search box (the placeholder is a hint) |
| F | Demand: ZIP table, map, city chips, row detail panel |
| G | Watchlist detail: 1842 W Maple or 1108 Peachtree (open from Market) |
| H | Watchlist detail: 55 Rio Grande or 902 Congress (open from Market) |
| I | Watchlist detail: 88 South Blvd (open from Market) |
| J | Market, then Conversions: compare the same rate names |

## 2. Look before you file

Click your zone on the live site. Look for something that is obviously wrong, or two facts that disagree.

You may ask the agent to open Throughline and click with you. Take a screenshot while you are on the broken state.

Stay on the live site. Do not open the application source code.

> **Expected:** You can describe the bug in one sentence and point to what is on screen.

## 3. File one ticket

Paste the prompt below into Agent chat. Replace the zone letter and say what you saw.

```
You are filing one Jira ticket on project RAW for Throughline.

Site: https://lockbox-status-intelligence.vercel.app
Zone: <letter>
Board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

Search RAW first for label throughline-workshop. If this issue is already filed, stop and give me that key.

Write a ticket a developer can implement: issue type Bug, summary starting with [Throughline], repro steps, expected vs actual, 2 or 3 testable acceptance criteria, priority, Track (Backend, Frontend, or Full-stack) in the description, label throughline-workshop.

Refuse a vague ticket. Ask me for a screenshot and tell me to attach it on the Jira issue page.

If Jira MCP is not available, print paste-ready markdown so I can create the issue in the RAW board UI.
```

Later in the repo, the same job is `/create-jira-ticket`. For Lab 1, pasting the text is enough.

### What a usable ticket looks like

Use this as the shape, not as a bug to file. Throughline does not have a Save search control; the example is formatting only.

- **Summary:** `[Throughline] Save search on Listings does nothing`
- **Repro:** Open Listings, type a city, click Save search
- **Expected:** The query is still there after refresh
- **Actual:** The button does not save anything
- **Acceptance criteria:** 2 or 3 things a developer can click to verify
- **Track:** Frontend (in the description; RAW has no Track field on the form)
- **Label:** `throughline-workshop`

### Path C (if MCP is down)

1. Ask the agent for paste-ready markdown.
2. Open the RAW board and click **Create**.
3. Paste the summary and description.
4. Add label `throughline-workshop` if the field is on the form.
5. Create the issue and write down the key (`RAW-NN`).

If you cannot click **Create**, raise a hand. Do not spend the lab on permissions.

## 4. Attach your screenshot

Open the new issue on RAW. Drag your screenshot onto the issue. Do not wait for MCP to upload files.

> **Expected:** The screenshot appears on the issue in Jira.

## Done when

- You have a RAW key written down.
- The ticket has repro steps, expected vs actual, and 2 or 3 acceptance criteria.
- A screenshot is on the issue.
- Track (Backend, Frontend, or Full-stack) is in the description.

Filing a second ticket in the same zone is optional. One solid ticket is enough.
