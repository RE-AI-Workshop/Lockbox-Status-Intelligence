# Cursor workspace notes (starter)

Copy to **`.cursor/README.md`**.

1. Install the workflow extension: `tools/project-workflow-agent/install.sh` then reload.
2. Generate slash chips: `node scripts/generate-cursor-commands.mjs` (requires `.github/prompts` and `.github/ai/CURSOR_AGENT_MODE.md`).
3. MCP: copy `mcp.json.example` → `mcp.json` locally, or run `node scripts/setup-cursor-mcp.mjs` after `.vscode/mcp.json` or `.env.local` exists. `setup-cursor-mcp.mjs` **needs this example file** when it builds from `.env.local`.
4. Every workflow step runs as **Agent**. Do not call `switch_mode`.
5. For two repos (API + UI), open a multi-root workspace so frontend steps can see both trees.

See the kit: `01-setup/00-slash-commands.md` and `01-setup/05-cursor.md`.
