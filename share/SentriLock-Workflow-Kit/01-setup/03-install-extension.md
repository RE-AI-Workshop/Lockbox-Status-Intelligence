# Install the workflow extension

The extension compiles TypeScript and copies `out/` into the IDE extensions folder. It is **not** on the public marketplace.

The default accepts standard ticket keys such as `DEMO-123`. A stricter regex is a workspace setting; see `02-porting/TICKET-PREFIX.md`.

Slash commands are **not** inside the `.vsix`. Read `01-setup/00-slash-commands.md`.

## VS Code + Copilot (recommended to match us)

```bash
cd your-repo/tools/project-workflow-agent
npm install
./install.sh --vscode
```

In VS Code: **Cmd+Shift+P → Developer: Reload Window**.

Confirm a status bar item like `Project Workflow` on the left. Open a workspace folder that contains `.github/ai`.

## Cursor

```bash
cd your-repo/tools/project-workflow-agent
npm install
./install.sh
```

Reload Cursor. Then generate command chips:

```bash
cd your-repo
node scripts/generate-cursor-commands.mjs
```

That writes `.cursor/commands/*.md` and prepends Agent-mode rules. Re-run it whenever you edit a prompt.

## Commands you should see

| Command palette | What it does |
|-----------------|--------------|
| Project Workflow: Start Dev Ticket | Asks for ticket id, opens `/intake-agent` |
| Project Workflow: Start QA Ticket | Opens `/qa-intake` |
| Project Workflow: Open Next Step | Manual advance |
| Project Workflow: Open Next QA Step | Manual QA advance |
| Project Workflow: Reset Notification State | New ticket / unstick |

Settings (VS Code Settings UI, `projectWorkflow.*`):

| Setting | Default | Meaning |
|---------|---------|---------|
| `transitionDelayMs` | 12000 | Wait before opening the next chat |
| `reworkLoopCap` | 5 | Stop automatic routing |
| `cursorSubmitWithCmdEnter` | true | Cursor submit key |
| `autoKeepAgentEdits` | false | VS Code only; leave off in Cursor |
| `ticketIdExample` | `DEMO-123` | Placeholder shown in the ticket prompt |
| `ticketIdPattern` | standard project key | Optional validation regex |

## Tests (optional, recommended after you change routing)

```bash
cd your-repo/tools/project-workflow-agent
npm test
```

## If the extension will not activate

1. Workspace must contain `.github/ai` (or `active-brief.md`).
2. You reloaded the window after install.
3. On Cursor, the install folder name is `sentrilock.project-workflow-agent-<version>`.
4. Fallback: `node scripts/project-workflow-watcher.mjs` in a spare terminal (notifies; you paste the slash yourself).

Project-specific names and commands belong in `.github/ai/PROJECT.md`; the extension can remain shared across projects.
