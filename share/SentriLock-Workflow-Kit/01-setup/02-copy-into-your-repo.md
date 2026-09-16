# Copy into one repository

Set paths:

```bash
KIT="{path-to-kit}/03-reference-implementation"
STARTER="{path-to-kit}/04-starter-drop-in"
REPO="{your-repo}"
```

Copy workflow files:

```bash
mkdir -p "$REPO/.github/prompts" "$REPO/.github/ai/templates" "$REPO/.github/ai/agent-errors" "$REPO/.vscode" "$REPO/.cursor" "$REPO/tools/project-workflow-agent" "$REPO/scripts/lib" "$REPO/vault"
cp "$KIT/prompts/"*.prompt.md "$REPO/.github/prompts/"
cp "$KIT/ai/"*.md "$KIT/ai/"*.json "$REPO/.github/ai/"
cp "$KIT/ai/templates/"* "$REPO/.github/ai/templates/"
cp "$KIT/ai/agent-errors/"* "$REPO/.github/ai/agent-errors/"
cp -R "$KIT/extension/." "$REPO/tools/project-workflow-agent/"
cp "$KIT/scripts/generate-cursor-commands.mjs" "$REPO/scripts/"
cp "$KIT/scripts/setup-cursor-mcp.mjs" "$REPO/scripts/"
cp "$KIT/scripts/project-workflow-watcher.mjs" "$REPO/scripts/"
cp "$KIT/scripts/project-workflow-open-next.mjs" "$REPO/scripts/"
cp "$KIT/scripts/run-api-suites.sh" "$REPO/scripts/"
cp "$KIT/scripts/smoke-test.sh" "$REPO/scripts/"
cp "$KIT/scripts/testrail-helpers.sh" "$REPO/scripts/"
cp "$KIT/scripts/trcli-config.yml" "$REPO/scripts/"
cp "$KIT/scripts/lib/"* "$REPO/scripts/lib/"
chmod +x "$REPO/scripts/"*.sh "$REPO/scripts/"*.mjs "$REPO/tools/project-workflow-agent/install.sh"
```

Copy required project-owned starters:

```bash
cp "$STARTER/ai/PROJECT.md" "$REPO/.github/ai/PROJECT.md"
cp "$STARTER/github/copilot-instructions.md" "$REPO/.github/copilot-instructions.md"
cp "$STARTER/env.example" "$REPO/.env.example"
cp "$STARTER/vscode/mcp.example.json" "$REPO/.vscode/mcp.example.json"
cp "$STARTER/vscode/tasks.example.json" "$REPO/.vscode/tasks.example.json"
cp "$STARTER/cursor/mcp.json.example" "$REPO/.cursor/mcp.json.example"
cp "$STARTER/cursor/README.md" "$REPO/.cursor/README.md"
cp -R "$STARTER/vault-starter/." "$REPO/vault/"
```

Create empty state files and apply `04-starter-drop-in/gitignore.fragment`:

```bash
: > "$REPO/.github/ai/active-brief.md"
: > "$REPO/.github/ai/active-qa-brief.md"
: > "$REPO/.github/ai/EVAL_LOG.md"
```

Append the gitignore fragment once:

```bash
touch "$REPO/.gitignore"
if ! grep -qF "# Workflow living state and secrets" "$REPO/.gitignore"; then
  printf '\n' >> "$REPO/.gitignore"
  cat "$STARTER/gitignore.fragment" >> "$REPO/.gitignore"
fi
```

Complete `.github/ai/PROJECT.md` and `.github/copilot-instructions.md` before installing. Keep prompts, templates, `PROJECT.md`, and project instructions committed. Keep filled env/MCP files local.

For a separate frontend repository, copy `frontend/copilot-instructions.md` into that repository
as `.github/copilot-instructions.md`, then set the frontend repository/path fields in `PROJECT.md`.
