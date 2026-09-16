# What was sanitized

Removed or replaced before this kit left our laptop:

- API tokens, passwords, `.env` values
- Live `mcp.json`
- Personal emails and machine paths
- Internal API hostnames
- Documentation page IDs and cloud instance names
- Identity **login maps** and test-member catalogs (you must build your own)
- Named test users, service-account logins, and live login emails in agent-error examples
  (replaced with placeholders such as `<fixture-user>` and `<login-email>@example.com`)
- Environment-specific record, account, and organization IDs in those logs
- `node_modules/` and compiled `out/` (run `npm install` yourself)

Kept on purpose (you need them to copy the machine):

- Full extension TypeScript, tests, `install.sh`, `package.json`
- All prompt files and workflow/QA docs
- Watcher / Cursor generate / Newman / smoke / TestRail helper scripts
- Generic agent-error starter files
- Role names used as process concepts (e.g. fixture admin = fixture setup)
- Placeholder fixture roles and IDs only
- A generic `/health` smoke template; replace it with project-safe liveness routes

If you forward this kit, do not add a filled `.env.local` or `mcp.json`.
