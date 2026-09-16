# Prerequisites

After install, confirm slash commands (`01-setup/00-slash-commands.md`) and `DAY-ONE-BLOCKERS.md`.

## Required

| Tool | Why |
|------|-----|
| Git repo you own | The workflow is file-native; it lives next to your code |
| Node.js 18+ | Extension compile (`npm install` / `npm run compile`) |
| VS Code **or** Cursor | Where agents run |
| GitHub Copilot Chat (if VS Code) with **Agent** mode | Team default we used |
| Ability to create `.github/prompts/` and `.github/ai/` | Driver looks for `.github/ai` to activate |

## Strongly recommended

| Tool | Why |
|------|-----|
| Jira + Atlassian API token | Intake fetches tickets instead of paste |
| `uv` / `uvx` | How we launch `mcp-atlassian` |
| A markdown vault (Obsidian optional) | Domain context the agents must read |

## Optional (port later)

| Tool | Used by |
|------|---------|
| Newman + Postman collections | Steps 4–5 |
| Your language test runner | Step 3 / QA-2 (for example `pytest` or `npm test`) |
| TestRail + `trcli` + `jq` | Plan/upload after green runs |
| Playwright or Selenium | UI verification (we used Playwright MCP) |

## Access

Jira: browse + read issues/comments/attachments at minimum. Write (comment, attach) is optional. See `03-reference-implementation/ai/JIRA_ACCESS_CHECKLIST.md`.

Do **not** put API tokens in markdown or in this kit when you send it onward.
