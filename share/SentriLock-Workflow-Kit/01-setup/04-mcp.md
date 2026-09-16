# Jira / Confluence MCP

Intake and release notes expect an Atlassian MCP server named in a way your prompts can call (we used `jira` / `mcp-atlassian`).

## Example config (no tokens in git)

Copy `04-starter-drop-in/vscode/mcp.example.json` to `.vscode/mcp.json` and fill:

- `JIRA_URL` — `https://<your>.atlassian.net`
- `JIRA_USERNAME` — the account that owns the API token
- `JIRA_API_TOKEN` — Atlassian API token
- `CONFLUENCE_URL` / `CONFLUENCE_USERNAME` / `CONFLUENCE_API_TOKEN` — same or a second token
- `ENABLED_TOOLS` — allowlist. Unused tools with broken schemas can take down the whole server.

## Cursor

```bash
node scripts/setup-cursor-mcp.mjs
```

It copies from `.vscode/mcp.json` or `.env.local` into `.cursor/mcp.json`.  
The `.env.local` path **reads** `.cursor/mcp.json.example` (copy it from `04-starter-drop-in/cursor/`). Without that file, the script exits.

## Smoke test

In Agent chat: fetch one known issue by key. You should see summary, description, and comments. If that fails, intake can still run from **pasted** ticket text (the prompt already has that fallback).

## What the prompts expect

- Read the ticket/wiki system and access method from `PROJECT.md`.
- Discover the configured integration's available tools; do not invent tool names.
- Fetch/search tickets and download attachments when supported.
- Create or update release-note pages only after explicit approval.

Cursor command generation changes command filenames for Plan-safe aliases. It does not rewrite
MCP calls or credentials.

## Do not

- Commit `mcp.json` with tokens
- Enable every Jira tool “just in case”
- Point MCP at production write tools until your safety gates are in the prompts
