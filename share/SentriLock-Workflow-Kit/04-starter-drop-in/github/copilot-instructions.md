# Agent instructions

Copy to **`.github/copilot-instructions.md`** at the repository where the workflow lives.
Prompts require-read this file. Project facts belong in `.github/ai/PROJECT.md`; this file adds
behavioral rules and repository conventions without duplicating commands or paths.

---

## Tool Restrictions

- **Ticket/wiki systems**: use the MCP or integration configured in `PROJECT.md`. Discover tools first, then call them.
- **Git**: terminal commands (`git status`, `git diff`, `git log`). Do not use a Git GUI MCP.
- Do not invent MCP server or tool names.

---

## Agent Handoff Standards

When asked for a "handoff", create or overwrite `HANDOFF.md` at the **workspace root**. Full format: `.github/prompts/handoff.prompt.md`.

Required sections (keep these names):

- Ticket Context
- Changes Made This Session
- API Surface Changes
- Test Status
- API Collection (omit when no suite ran)
- What the Receiving Agent Needs to Do
- Open Items / Caveats
- Test Management (omit when disabled or unused)

Do not commit secrets. Do not claim tests passed unless you ran them.

---

## Safety Gates — Required Human Approval

**Do not perform any of the following without explicit human confirmation:**

- `git commit`, `git push`, `git merge`, branch creation or deletion
- Pipeline runs or pipeline YAML edits
- Deployments, pod restarts, production writes
- Database migrations
- Bulk API jobs that can hit a rate limit
- Changes to credential or environment URL files

When a task would require one of these, stop, say what you intend to do, and wait.

---

## Agent Knowledge Files — Write Locations

Write reusable lessons to **committed** files, not chat-only memory.

| Knowledge type | Write to |
|----------------|----------|
| Agent pitfalls, build errors | `.github/ai/agent-errors/<agent-file>.md` plus `misc.md` |
| Unit test patterns | `.github/ai/testing-patterns.md` |
| Fixture catalogs | `vault/` (your index) |
| API / suite conventions | `vault/` |

---

## Project Context

Read `.github/ai/PROJECT.md` for repositories, commands, paths, architecture rules,
environments, fixture roles, optional stages, and publishing destinations. If this repository
needs conventions not represented there, add only those conventions below:

- N/A — replace this line only when the repository needs an additional convention

## Architecture

- Follow the layer ownership and data-access rules in `PROJECT.md`.
- Follow existing patterns in the file being modified.
- Code comments describe *what* and *why*, not ticket IDs or AC numbers.

## Test Generation Guidelines

- Tests accompany every code change.
- Prefer edge cases over happy-path-only.
- Use real field names from the vault. Do not invent enums.
