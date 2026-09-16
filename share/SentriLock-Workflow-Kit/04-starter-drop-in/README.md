# Starter drop-in

Use these for project-owned configuration, empty logs, and a generic domain vault.

Still copy **prompts, WORKFLOW.md, extension, and scripts** from `03-reference-implementation/`. Those are the product.

| Item | Copy to |
|------|---------|
| `ai/PROJECT.md` | **Required.** Repo `.github/ai/PROJECT.md`; fill per project |
| `github/copilot-instructions.md` | **Required.** Repo `.github/copilot-instructions.md` |
| `frontend/copilot-instructions.md` | UI repo `.github/copilot-instructions.md` if you have one |
| `env.example` | repo `.env.example` (then local `.env.local`) |
| `vscode/mcp.example.json` | `.vscode/mcp.example.json` (then local `mcp.json`) |
| `vscode/tasks.example.json` | `.vscode/tasks.json` after you fill real commands |
| `cursor/mcp.json.example` | `.cursor/mcp.json.example` (`setup-cursor-mcp.mjs` reads this) |
| `cursor/README.md` | `.cursor/README.md` |
| `scripts/smoke-test.template.sh` | `scripts/smoke-test.sh` after you rewrite checks |
| `vault-starter/` | `vault/` (set the resulting paths in `PROJECT.md`) |
| `ai/agent-errors/*.md` | committed reusable learning logs |

The setup sequence creates the living brief and evaluation files as empty files; they are not
shipped as starter artifacts. See `01-setup/02-copy-into-your-repo.md`.
