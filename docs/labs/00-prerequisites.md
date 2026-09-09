# Prerequisites

Do this before Lab 1. You still do not need the GitHub repo.

By the end, you should be able to open Throughline, click **Create** on the RAW board, and either talk to Jira through Cursor or know you will paste a ticket by hand.

Set the Cursor chat to **Agent**, not Plan or Ask.

## Links

- Throughline: https://lockbox-status-intelligence.vercel.app
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Token help: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

## 1. Confirm you can file on RAW

1. Open the RAW board link above.
2. Click **Create**.

> **Expected:** A create-issue form opens. If you do not see **Create**, raise a hand. Do not spend the session fighting permissions.

## 2. Create an API token

1. Open the token page. Sign in with the same Atlassian account that can see RAW.
2. Create a token and copy it once. You will not see it again.

## 3. Add Jira to Cursor

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

## 4. Smoke test

In an Agent chat, ask:

`List issues in project RAW`

> **Expected:** Cursor makes a Jira tool call and returns a short list of issues.

### If this did not work

- Put the token in `JIRA_API_TOKEN`, not in `JIRA_URL`.
- Use the Atlassian email for the account that can see RAW.
- If Cursor never calls a Jira tool after 2 minutes, skip MCP for now. Lab 1 still counts if you create the issue in the RAW UI by hand.

You do not need Node installed yet.
