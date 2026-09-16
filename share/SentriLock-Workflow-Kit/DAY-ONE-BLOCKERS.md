# Day-one blockers

Complete these before **Project Workflow: Start Dev Ticket**.

1. **Project config exists** — copy `04-starter-drop-in/ai/PROJECT.md` to `.github/ai/PROJECT.md` and replace every required placeholder.
2. **Slash commands exist** — VS Code uses `.github/prompts/*.prompt.md`; Cursor also needs `node scripts/generate-cursor-commands.mjs`.
3. **Project instructions exist** — copy `04-starter-drop-in/github/copilot-instructions.md` to `.github/copilot-instructions.md`.
4. **Extension settings match ticket keys** — defaults accept normal keys such as `DEMO-123`; customize `projectWorkflow.ticketIdPattern` only if needed.
5. **Optional stages are explicit** — set API suite, post-deploy QA, release publishing, and external test management to exactly `enabled` or `disabled`. Configure publishing destinations before enabling release publishing.
6. **Require-read docs exist** — prompts read the domain documentation, recurring patterns, fixture catalog, and `.github/ai/agent-errors/*`. Copy the starters from `04-starter-drop-in/` so those paths resolve; they start nearly empty and accumulate per project.
7. **Smoke routes are ported** — the included smoke file checks `/health` only. Replace it with safe project liveness routes.
8. **No secrets are committed** — `.env.local`, `.vscode/mcp.json`, and `.cursor/mcp.json` stay local/gitignored.
