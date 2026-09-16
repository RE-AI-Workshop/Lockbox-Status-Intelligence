# Ticket key configuration

The extension accepts standard keys such as `DEMO-123`, `APP-42`, or `TEAM_API-9` by default. Most projects need no code change.

For a stricter project rule, set these workspace settings:

```json
{
  "projectWorkflow.ticketIdExample": "DEMO-123",
  "projectWorkflow.ticketIdPattern": "^DEMO-[0-9]+$"
}
```

Use the same example and pattern in `.github/ai/PROJECT.md`. The static brief parser intentionally accepts the broader standard form so saved briefs remain portable.
