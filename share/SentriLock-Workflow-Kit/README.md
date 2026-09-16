# SentriLock Project Workflow Kit

A reusable, project-configurable delivery workflow for VS Code Copilot and Cursor. It includes ticket intake, implementation, tests, review/rework, handoff, optional API contract testing, and optional post-deploy QA.

The kit contains **no product-specific assumptions by default**. It intentionally retains the full pipeline structure, prompt depth, file names, routing protocol, rework logic, and optional integration examples. Each repository supplies its own facts in one file:

> `.github/ai/PROJECT.md` — project name, ticket pattern, repositories, commands, paths, environments, fixture roles, and optional stages.

Prompts read that file first and stop instead of guessing unresolved placeholders.

This is a framework to integrate, not a zero-configuration tool. Do not rename the prompt,
brief, template, or `agent-errors/` files unless you also update the extension and its tests.

## Give this folder to

Engineers who will install the workflow into one or more SentriLock repositories. Each project keeps its own committed `PROJECT.md`; the shared prompts and extension can remain the same.

## Folder map

| Folder | Purpose |
|--------|---------|
| `00-overview/` | Architecture and file map |
| `01-setup/` | Copy/install/configure/verify instructions |
| `02-porting/` | Per-project configuration guidance |
| `03-reference-implementation/` | Generic prompts, AI docs, scripts, extension source |
| `04-starter-drop-in/` | Project config, environment, MCP, vault, and smoke templates |
| `05-operator-manual/` | Daily workflow and safety gates |
| `06-worked-examples/` | Fictional project-neutral artifacts |

## Install in one project

1. Read `DAY-ONE-BLOCKERS.md`.
2. Follow `01-setup/02-copy-into-your-repo.md`.
3. Copy and complete `04-starter-drop-in/ai/PROJECT.md` as `.github/ai/PROJECT.md`.
4. Copy `04-starter-drop-in/github/copilot-instructions.md` and add any repository-only conventions.
5. Install the extension with `01-setup/03-install-extension.md`.
6. Configure MCP locally from the examples; never commit tokens.
7. For Cursor, run `node scripts/generate-cursor-commands.mjs`.
8. Run the verification checklist, then test with a disposable ticket.

## Stable workflow

- Backend: Intake → Implement → Unit Tests → API/Contract Suite → Execute → Review → Handoff
- Frontend: Intake → Frontend Implement → Frontend Tests → Frontend Review → Frontend Handoff
- Full-stack: backend path, then frontend path
- QA (optional): QA Intake → Regression → Smoke → Report

Set unused stages to `disabled` in `PROJECT.md`. The stage records a documented skip instead of inventing tools.

## Safety

Agents require explicit human approval before commit/push/merge, deployments, production writes, migrations, pipeline changes, bulk jobs, credential-file changes, or external publication. See `05-operator-manual/SAFETY-GATES.md`.

## Sanitization

No live credentials, MCP configs, personal emails, machine paths, internal hosts, named accounts, or environment-specific fixture catalogs are included. Example values use placeholders or reserved domains. Do not add a filled `.env.local` or `mcp.json` before sharing.
