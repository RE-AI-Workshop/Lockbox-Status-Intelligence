# How slash commands actually appear

The extension does not contain the worker prompts. It **types a slash name** into a new Agent chat. If that name is not a registered command, the model only sees the words `/intake-agent` and does **not** load the prompt file.

## VS Code + Copilot

1. Copy `*.prompt.md` to **`.github/prompts/`** (this path, not `docs/prompts`).
2. Each file already has YAML frontmatter (`agent: agent`).
3. Reload the window. In Copilot Chat, `/` should list `intake-agent`, `backend-implementation`, and the rest.
4. If the list is empty: confirm the files are in the **workspace root** you opened (not a parent folder).

You do **not** run `generate-cursor-commands.mjs` for VS Code.

## Cursor

Cursor chips come from **`.cursor/commands/*.md`**, not from `.github/prompts`.

```bash
# After prompts and .github/ai/CURSOR_AGENT_MODE.md are in the repo:
node scripts/generate-cursor-commands.mjs
```

Re-run that script whenever you edit a prompt. Commit `.cursor/commands/` so teammates do not each have to generate.

**Aliases** (Cursor only — the extension types these, not the long names):

| Canonical (VS Code / prompts) | Cursor chip |
|-------------------------------|-------------|
| `/backend-implementation` | `/backend-code` |
| `/frontend-implementation` | `/frontend-code` |
| `/api-execution` | `/api-run` |
| `/workflow` | `/project-flow` |
| `/qa-workflow` | `/qa-flow` |

`/intake-agent`, `/unit-test`, `/reviewer`, `/handoff` keep the same names.

If generate fails: it requires `.github/ai/CURSOR_AGENT_MODE.md` to contain the words `switch_mode` and `Never`. Copy that file from the reference `ai/` folder — do not replace it with a blank note.

## Quick check

| IDE | Check |
|-----|--------|
| VS Code | Copilot Chat `/` menu lists `intake-agent` |
| Cursor | `.cursor/commands/intake-agent.md` and `.cursor/commands/backend-code.md` exist; Chat `/` lists both |

If Start Dev Ticket opens a chat and the model asks “what should I do?”, the slash command was not registered.
