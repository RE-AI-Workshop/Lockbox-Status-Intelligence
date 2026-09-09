# Prerequisites

Get Cursor and Jira talking before Lab 1. You do not need the GitHub repo for this page.

Goal: you can open Throughline, you can click Create on RAW, and you either have Jira MCP working or you know you will paste the ticket by hand.

Set the Cursor chat to **Agent**, not Plan, not Ask.

## Links

- Throughline app: https://<THROUGHLINE_URL>
- RAW board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3
- Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
- Token help: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

## API token and MCP

1. Open the RAW board. Confirm you can click **Create**.
2. Open the token page. Sign in with the same Atlassian account that can see RAW.
3. Create a token. Copy it once. You will not see it again.
4. In Cursor, open **Settings**, then **MCP**. Add or edit a server named `jira` using the JSON below.
5. Put your Atlassian email in `JIRA_USERNAME`.
6. Put the token in `JIRA_API_TOKEN`.
7. Leave `JIRA_URL` as `https://dconroy.atlassian.net`.
8. Enable the server. Reload if Cursor asks.
9. In an Agent chat, ask: `List issues in project RAW`. You should see a tool call and a short list.

If this took more than 2 minutes, stop. In Lab 1 you will paste the ticket into the RAW board instead.

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

### If this did not work

- Token belongs in `JIRA_API_TOKEN`. Do not put it in `JIRA_URL`.
- Use the Atlassian email for the account that can see RAW.
- If Cursor never shows a Jira tool call, skip MCP. Lab 1 still counts if you create the issue in the RAW UI.

You do not need Node or a clone yet.
