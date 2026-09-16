# File map

## After you copy into your repo

```
your-repo/
  .github/
    prompts/                 # slash commands (the workers)
      intake-agent.prompt.md
      backend-implementation.prompt.md
      unit-test.prompt.md
      api-suite.prompt.md
      api-execution.prompt.md
      reviewer.prompt.md
      handoff.prompt.md
      frontend-*.prompt.md
      qa-*.prompt.md
      release-notes.prompt.md
      workflow.prompt.md
    copilot-instructions.md  # REQUIRED — handoff/reviewer read this
    ai/
      PROJECT.md             # REQUIRED — all per-project facts
      WORKFLOW.md
      AGENT_CATALOG.md
      QA_WORKFLOW.md
      QA_AGENT_CATALOG.md
      CURSOR_AGENT_MODE.md
      EVAL_SCORECARD.md
      JIRA_ACCESS_CHECKLIST.md
      cursor-slash-aliases.json
      testing-patterns.md
      FE_PLAYWRIGHT.md
      templates/             # TICKET_BRIEF / QA_BRIEF / QA_REPORT / API_SUITE_TASK + collection skeleton
      agent-errors/          # filenames must match prompts (backend-implementation.md)
      active-brief.md        # living state (gitignored or overwritten each ticket)
      active-qa-brief.md
      EVAL_LOG.md            # appended by handoff
      NEXT_STEP.md           # CLI watcher output only (gitignored)
  tools/project-workflow-agent/   # extension source (rename if you want)
  scripts/
    generate-cursor-commands.mjs
    setup-cursor-mcp.mjs
    project-workflow-watcher.mjs
    project-workflow-open-next.mjs
    lib/
    run-api-suites.sh        # generic Newman wrapper
    smoke-test.sh            # generic /health starter
    testrail-helpers.sh      # optional
  vault/                     # starter domain docs; paths are configured in PROJECT.md
    AGENTS.md
    README.md
    Identity-Patterns.md
    Engineering-Patterns.md
    Contract-Test-Guide.md
    Test-Fixtures.md
  .vscode/mcp.json           # local, gitignored — from mcp.example.json
  .vscode/tasks.json         # optional — labels build / test-unit / start-api
  .cursor/mcp.json.example   # required by setup-cursor-mcp.mjs (env path)
  .cursor/commands/          # Cursor only — generated, should be committed
  .cursor/workflow-config.json # optional CLI watcher timing overrides
  .cursor/workflow-state.json  # CLI watcher state (gitignored)
  .cursor/workflow-pending.json # CLI watcher pending transition (gitignored)
  .env.local                 # local, gitignored — from env.example
```

## In this kit

| Path | Purpose |
|------|---------|
| `03-reference-implementation/extension/` | Full extension (src + install + tests). No `node_modules`. |
| `03-reference-implementation/prompts/` | The 18 full prompt files — the process itself. `PROJECT.md` supplies project values; the prompts keep the gates, rubrics, and step contracts. |
| `03-reference-implementation/ai/` | Project config, workflow docs, agent catalogs, test conventions, templates, learning logs |
| `03-reference-implementation/scripts/` | Cursor generate, MCP setup, watchers, Newman/smoke/TestRail |
| `04-starter-drop-in/` | Empty briefs, error-log stubs, vault starter, MCP/env/tasks, copilot-instructions |
| `06-worked-examples/` | Filled brief / handoff / eval examples (fictional ticket) |
