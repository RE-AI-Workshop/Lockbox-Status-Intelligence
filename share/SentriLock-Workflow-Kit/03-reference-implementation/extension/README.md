# Project Workflow Agent Extension

Watches `active-brief.md` and `active-qa-brief.md`, then opens a fresh agent chat with the next step when each step completes **and** that step's summary is already in the brief. Supports dev and QA pipelines, rework loops (code vs tests), and full-stack routing.

**Cursor:** `workbench.action.chat.open` only puts `query` in the composer as **plain text** and inherits the last mode (often Plan). A real `/reviewer` is a slash-picker **command chip**. The extension opens a new chat with `unifiedMode: agent`, types a **Plan-nudge-safe** slash (e.g. `/backend-code` for backend-implementation — Cursor substring-matches `implementation` and flips to Plan when the chip binds), presses Enter to select the picker row, then submits. It does not dump the markdown, and it does not press Escape (that dismisses the picker). If the chat never opens it does **not** send ⌘+Enter. **VS Code Copilot** still opens native `/slash` prompt files.

Works in **VS Code Copilot** (team default) and **Cursor** (optional).

## Install

```bash
# VS Code Copilot (team)
./install.sh --vscode

# Cursor (solo dev)
./install.sh
```

Reload the IDE: **Cmd+Shift+P → Developer: Reload Window**.

## Usage

**VS Code:** Run `/intake-agent DEMO-123` in Copilot Chat. Extension auto-opens subsequent steps.

**Cursor:** **Cmd+Shift+P → Project Workflow: Start Dev Ticket** (or Start QA Ticket). Extension auto-opens subsequent Agent chats.

Manual override: **Project Workflow: Open Next Step** / **Open Next QA Step**.

## Cursor setup

MCP configuration is machine-local and gitignored. Generated command files should be committed
so every teammate gets the same Plan-safe aliases:

```bash
node scripts/setup-cursor-mcp.mjs          # .cursor/mcp.json from .vscode/mcp.json or .env.local
node scripts/generate-cursor-commands.mjs  # .cursor/commands/ from .github/prompts/
```

For multi-repository tickets, open the workspace containing the repositories listed in `.github/ai/PROJECT.md`.

Prompt source of truth for all IDEs: `.github/prompts/*.prompt.md`.
Project-specific settings belong in `.github/ai/PROJECT.md`.

## Development

```bash
npm install
npm test        # routing unit tests
npm run watch   # recompile on save, then reload IDE
```

## Commands

| ID | Title |
|----|-------|
| `projectWorkflow.startDevTicket` | Project Workflow: Start Dev Ticket (Cursor) |
| `projectWorkflow.startQaTicket` | Project Workflow: Start QA Ticket (Cursor) |
| `projectWorkflow.openNextStep` | Project Workflow: Open Next Step |
| `projectWorkflow.openNextQaStep` | Project Workflow: Open Next QA Step |
| `projectWorkflow.resetState` | Project Workflow: Reset Notification State |
