# What you are installing

You are not installing “an AI.” You are installing a **state machine** whose workers are language-model agents.

```
Human starts ticket
        ↓
Intake agent writes active-brief.md (track + ACs + progress table)
        ↓
Extension watches the brief
        ↓
New Agent chat with the next slash command
        ↓
That agent does one job, writes a Step N Summary, then marks ✅ Complete
        ↓
Extension opens the next chat
        ↓
Review can loop (code vs tests) up to 5 times
        ↓
Handoff.md  →  optional QA pipeline on a second brief file
```

## Three layers (keep these in your heads)

1. **Prompts** — `.github/prompts/*.prompt.md`  
   One file per job. Stop conditions, quality bar, required output.

2. **Context** — vault / docs + `active-brief.md` + `agent-errors/`  
   What the agent is required to read. What it must write back.

3. **Harness** — the extension (and optional Node watchers)  
   Parses the brief. Opens chats. Enforces “summary exists before Complete counts.” Routes rework.

The extension **types** `/intake-agent`. It does not ship the prompt body. If that slash is not registered in the IDE, the worker never loads. See `01-setup/00-slash-commands.md`.

`/workflow` and `/qa-workflow` are one-chat alternatives to this state machine. Disable the
extension for the workspace while running either one, or both systems will try to advance.

Handoff and review also require-read `.github/copilot-instructions.md`. Copy the starter file; do not skip it.

## What runs where

| Runtime | Role |
|---------|------|
| VS Code + GitHub Copilot Chat (Agent mode) | Team default in our shop |
| Cursor Agent | Same prompts; slash names are aliased so Cursor does not flip to Plan |
| `scripts/project-workflow-watcher.mjs` | Limited notify/paste fallback if you cannot install the extension; not routing parity |
| Jira / Confluence MCP | Live ticket fetch; release notes publish |
| Your test CLI | Whatever Step 3 / QA-2 invoke after you port commands |

## Files the driver actually reads

| File | Parsed? |
|------|---------|
| `.github/ai/active-brief.md` | Yes — ticket id, track, `✅ Complete`, `⛔ Blocked`, rework loops, verdict |
| `.github/ai/active-qa-brief.md` | Yes — QA-n Complete rows |
| `.github/prompts/*.prompt.md` | No — the IDE injects these as the agent’s job when a slash command runs |

Markdown tables and headings are the API. Do not “pretty up” the status cell wording.

## Safety (copy these even if you change everything else)

Agents must **not**, without a human:

- `git commit` / `push` / `merge`
- production writes
- database migrations
- editing pipeline YAML
- publishing Confluence (release-notes agent waits for yes)

Those rules live in the prompts and in `05-operator-manual/SAFETY-GATES.md`.
