# Configure one project

Most porting now happens in one committed file: `.github/ai/PROJECT.md`.

1. Project identity and ticket pattern
2. Repository paths and responsibilities
3. Install/build/test/start/health commands
4. Domain docs, test conventions, fixture catalog, identity patterns
5. Local/test environments and write policy
6. Role-based fixture keys (names only, never values)
7. Optional stages
8. Project architecture and domain invariants

Also fill the Project Context section in `.github/copilot-instructions.md`. Only edit prompts when a project truly has a different workflow contract, not merely different commands or nouns. After extension changes run `cd tools/project-workflow-agent && npm install && npm test`.
