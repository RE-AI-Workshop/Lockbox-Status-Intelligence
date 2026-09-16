# Project configuration

This is the single source of project-specific facts for the workflow. Copy it to `.github/ai/PROJECT.md` and complete it before the first ticket. Prompts must read this file and must not guess missing values. Every angle-bracket placeholder (`<...>`) and every `enabled | disabled` choice left unresolved is a stop condition for the agents, not a default.

## Identity

- **Project name:** `<project-name>`
- **Ticket key example:** `DEMO-123`
- **Ticket key pattern:** `^[A-Z][A-Z0-9_-]*-[0-9]+$`
- **Ticket system:** `Jira`
- **Ticket system access:** `<MCP server name, or "paste ticket text">`

## Repositories

| Role | Path | Framework / language | Notes |
|------|------|----------------------|-------|
| Primary/backend | `<repo-root or relative path>` | `<language and framework>` | |
| Frontend | `<path or N/A>` | `<framework>` | |
| Additional service | `<path or N/A>` | `<framework>` | `<responsibility>` |

Agents must implement every repository listed in a brief's **Affected Repositories** in the same step — never defer a sibling repository to a follow-up ticket.

## Commands

- **Install:** `<command or N/A>`
- **Build:** `<command>`
- **Unit tests:** `<command>`
- **Unit tests (filtered):** `<command with filter placeholder, or N/A>`
- **Regression tests:** `<command or N/A>`
- **Integration tests:** `<command or N/A>`
- **API/contract suite:** `<command or N/A>`
- **API/contract format:** `<Postman / Bruno / code-based tests / other / N/A>`
- **Frontend tests:** `<command or N/A>`
- **Frontend build:** `<command or N/A>`
- **Frontend lint:** `<command or N/A>`
- **Start local app/API:** `<command>`
- **Local health check:** `<command or URL>`
- **Smoke tests:** `<command or N/A>`
- **Diff review:** `<command, e.g. git diff --stat>`

## Paths

- **Domain documentation:** `<path, e.g. docs/domain or vault/>`
- **Domain rules file:** `<path, e.g. vault/AGENTS.md>`
- **Recurring patterns:** `<path, e.g. vault/Engineering-Patterns.md>`
- **Status and domain codes:** `<path or N/A>`
- **Test conventions:** `<path, e.g. .github/ai/testing-patterns.md>`
- **Fixture catalog:** `<path, e.g. vault/Test-Fixtures.md>`
- **Identity/caller patterns:** `<path or N/A>`
- **API collection directory:** `<path or N/A>`
- **Unit test project/suite:** `<path or N/A>`
- **Regression test project/suite:** `<path or N/A>`
- **Smoke script:** `<path or N/A>`
- **Frontend components:** `<path or N/A>`
- **Frontend state/store:** `<path or N/A>`
- **Frontend router:** `<path or N/A>`

## Architecture and domain rules

- **Business logic belongs in:** `<layer, e.g. service layer>`
- **Transport layer rule:** `<e.g. controllers validate and delegate only>`
- **Data access convention:** `<e.g. all queries in the data-access layer>`
- **Validation guard placement:** `<e.g. before transaction start so unit tests reach it>`
- **API naming/serialization convention:** `<e.g. PascalCase DTO fields>`
- **Route families:** `<e.g. /api for internal callers, /ext for external callers, or N/A>`
- **Rate limits:** `<e.g. 600 requests / 60 seconds, or N/A>`
- **Important domain invariants:** `<list>`
- **Upstream/platform API:** `<name and where its rules are documented, or N/A>`

## Test environments

| Name | Base URL variable | Intended use | Writes allowed? |
|------|-------------------|--------------|-----------------|
| Local | `BASE_URL` | implementation and contract checks in Steps 2-5 | Yes, disposable data only |
| Test | `<variable>` | post-deploy QA | Per team policy |

Implementation steps run against **Local**. Post-deploy QA runs against **Test**. Never mix them in one step, and never point either at production.

## Fixture roles

Use role names and environment-variable keys, never real people or production credentials.

| Purpose | Environment variable / catalog key |
|---------|------------------------------------|
| Privileged fixture setup | `<FIXTURE_ADMIN_AUTH>` |
| Standard caller | `<STANDARD_CALLER_AUTH>` |
| Specialized caller shapes | `<keys or N/A>` |

Fixture setup and cleanup may use the privileged account. The request under assertion must use the caller the acceptance criterion names — never "fix" an authorization failure by switching the assertion to the privileged account.

## Optional stages

Set unused stages to `disabled`. The routing extension still uses the standard progress table; prompts mark disabled stages `⏭️ Skipped` and document why in the step summary.

- **API suite:** `enabled | disabled`
- **Post-deploy QA:** `enabled | disabled`
- **Release notes publishing:** `enabled | disabled`
- **External test management:** `enabled | disabled` — `<system name, e.g. TestRail, or N/A>`
- **External test management helper:** `<path to adapter/helper, or N/A>`
- **External test result directory:** `<path, or N/A>`

## Publishing destinations

- **Documentation/wiki system:** `<system and access method, or N/A>`
- **Internal release-notes root:** `<destination id/path, or N/A>`
- **External release-notes root:** `<destination id/path, or N/A>`

## Human approval gates

Always require explicit human approval for commits, pushes, deployments, production writes, database migrations, pipeline changes, bulk jobs, and publishing to any external system.
