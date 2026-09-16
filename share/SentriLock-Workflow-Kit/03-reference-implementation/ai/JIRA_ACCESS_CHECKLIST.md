# Jira Access Checklist for Agent Workflows

Use this checklist before enabling ticket-driven automation.

## Minimum Read Access

- Browse projects
- Read issues and subtasks
- Read comments and history
- Read attachments
- Read linked issues and epics
- Read custom fields used in acceptance criteria

## Nice-to-Have Write Access

- Add comments with run summaries
- Transition issue status (optional, human approval preferred)

## Data Needed by Agents

- Jira base URL
- Project key(s)
- Issue key format
- Field mapping for:
  - Acceptance criteria
  - Priority/severity
  - Story points (if used)
  - Labels/components

## Auth Options

Choose one:
- API token for service account (recommended)
- OAuth app with read scope
- Manual export fallback (copy ticket details into prompt)

## Security Notes

- Store tokens in local secure env only
- Do not put secrets in markdown files or handoff artifacts
- Redact PII from copied ticket content when possible

## Connectivity Smoke Test

A setup is ready when all are true:
- Agent can fetch ticket summary and description
- Agent can fetch acceptance criteria field
- Agent can fetch latest comments
- Agent can resolve at least one linked issue

If any check fails, pause automation and use manual ticket brief mode.
