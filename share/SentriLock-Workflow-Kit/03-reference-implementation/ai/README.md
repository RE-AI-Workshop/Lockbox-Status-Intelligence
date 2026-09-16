# AI Delivery Kit

This directory contains a practical AI engineering system for this repository. Configure the project once in `PROJECT.md`; every prompt and agent reads its values from there.

## Start Here

**Configure the project first:**

- `PROJECT.md` — the per-project configuration file: repositories, commands, paths, architecture rules, test environments, fixture roles, optional stages, and approval gates. Prompts must read it before acting and must stop on any unresolved angle-bracket placeholder or `enabled | disabled` choice instead of guessing.

**VS Code Copilot (team default):**

Install the workflow extension, then run `/intake-agent` in Copilot Chat:

```bash
extension/install.sh --vscode
```

Reload VS Code. The extension watches `active-brief.md` and opens the next Copilot agent chat when a step is `✅ Complete` **and** that step's summary is already in the brief.

`/workflow` is the one-chat alternative for tiny work. Disable the extension for the workspace first; otherwise both the orchestrator and the extension advance the same pipeline.

**Cursor (optional):**

The same extension works in Cursor with Agent chats. Commit generated `.cursor/commands/` so the team gets the same slash commands, and keep `.cursor/mcp.json`, workflow state, credentials, and machine-local helper configuration gitignored. See `extension/README.md`.

| Prompt | When to use standalone |
|--------|------------------------|
| `/intake-agent` | Review or revise a brief without implementing |
| `/backend-implementation` | Implement from a completed brief |
| `/unit-test` | Fill coverage gaps on an existing diff |
| `/api-suite` | Build a suite for an existing endpoint change |
| `/api-execution` | Run and triage an existing suite |
| `/reviewer` | Review an existing diff or PR |
| `/handoff` | Write a handoff for a session in progress |

## Reference Docs

- Project configuration: `PROJECT.md` (read this before any step)
- Workflow steps: `WORKFLOW.md`; agent roles: `AGENT_CATALOG.md`
- QA pipeline: `QA_WORKFLOW.md`, `QA_AGENT_CATALOG.md`
- Ticket system access: `JIRA_ACCESS_CHECKLIST.md`
- Quality metrics: `EVAL_SCORECARD.md`
- Test conventions: `testing-patterns.md`
- Brief template: `templates/TICKET_BRIEF_TEMPLATE.md`
- Frontend browser verification: `FE_PLAYWRIGHT.md`
- Cursor execution mode: `CURSOR_AGENT_MODE.md`, `cursor-slash-aliases.json`
- Agent error log: `agent-errors/` (per-agent files; index: `agent-errors/README.md`). The sibling `agent-errors.md` is a retired pointer — do not write lessons there.

Living state is `.github/ai/active-brief.md` and `.github/ai/active-qa-brief.md`. Do not put secrets in either file.

## API Suite Execution

Use the runner script from the repository root — `scripts/run-api-suites.sh`.

Default behavior:
- Runs the configured **API/contract suite** command (`PROJECT.md` → Commands). Postman collections executed with Newman are the shipped example runner.
- Searches the configured collection directory (`PROJECT.md` → Paths → API collection directory)
- Applies environment variables when provided: the environment base URL, the standard caller credentials, and each fixture-role key from `PROJECT.md` → Fixture roles
- Copy fixture-role key names exactly from `PROJECT.md` and the identity patterns doc — do not invent a variable that is not in that map
