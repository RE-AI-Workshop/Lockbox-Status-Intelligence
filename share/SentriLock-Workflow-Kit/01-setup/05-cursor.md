# Cursor-specific setup

Skip this page if you only use VS Code Copilot.

## Why Cursor needs extra files

Cursor slash chips substring-match names. Words like `implementation`, `workflow`, and `execution` can flip the UI to **Plan**. Our aliases:

```
backend-implementation  →  /backend-code
frontend-implementation →  /frontend-code
api-execution          →  /api-run
workflow               →  /project-flow
qa-workflow            →  /qa-flow
```

Source: `03-reference-implementation/ai/cursor-slash-aliases.json`  
The extension types the **alias** in Cursor and the **canonical** name in VS Code.

## Generate commands

```bash
node scripts/generate-cursor-commands.mjs
```

Requires `.github/ai/CURSOR_AGENT_MODE.md` (do not remove the `switch_mode` / Never rules).

## Agent mode

Every step must run as **Agent** (edit files, run terminal). Prompts say: never call `switch_mode`; if Plan blocks edits, stop and tell the human to set Agent.

## Workspace

If you have two repos (API + UI), open a multi-root workspace so frontend steps can see both trees. We used a local `*-FullStack.code-workspace` (not in this kit).
