# Project configuration checklist

Do not search/replace prompts for ordinary project setup. Complete `.github/ai/PROJECT.md` instead.

Required:
- project name, ticket-key example/pattern, and ticket-system access
- repository paths and frameworks (primary, frontend, additional service)
- build, unit, regression, integration, frontend test/build/lint, API-suite format/command, start, health, and diff commands (`N/A` where unsupported)
- paths the prompts require-read: domain documentation and its rules file, recurring patterns, status/domain codes, test conventions, fixture catalog, identity/caller patterns, API collection directory, test project locations, and frontend component/state/router locations
- architecture and domain rules: layer ownership, guard placement, naming/serialization convention, route families, rate limits, domain invariants
- environments and write policy (Local for Steps 2-5, Test for QA)
- fixture role key names
- enabled/disabled optional stages, including external test management
- publishing destinations when release-note publishing is enabled

Anything left as `N/A` is honored: prompts skip that behavior instead of inventing a tool.
Any angle-bracket placeholder (`<...>`) or `enabled | disabled` choice left unresolved is a
stop condition — the agent will halt and name it.

Then search for unresolved placeholders:

```bash
rg -n '<[^>]+>|enabled \| disabled' .github/ai/PROJECT.md .github/copilot-instructions.md
```

Custom extension settings belong in workspace settings:

```json
{
  "projectWorkflow.ticketIdExample": "DEMO-123",
  "projectWorkflow.ticketIdPattern": "^DEMO-[0-9]+$",
  "projectWorkflow.reworkLoopCap": 5
}
```

The extension does not parse Markdown configuration. Keep `ticketIdExample`,
`ticketIdPattern`, and `reworkLoopCap` aligned with the equivalent values in `PROJECT.md`.
