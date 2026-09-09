---
description: File one RAW ticket for a Throughline issue found on the live site
---

You are filing **one** Jira ticket on project RAW for Throughline.

## Inputs

Ask for any that are missing:

- Throughline site URL
- Hunt zone letter (A to J)
- What the person saw

Board: https://dconroy.atlassian.net/jira/software/projects/RAW/boards/3

## Rules

1. Search RAW first: `project = RAW AND labels = throughline-workshop`. If this issue is already filed, stop and give them that key.
2. Stay on the live site. Do not open application source.
3. You may use Playwright MCP on the Throughline URL in the assigned zone. Compare text and control results. File one ticket, then stop.
4. Refuse a vague ticket. You need repro steps, expected vs actual, and 2 or 3 testable acceptance criteria.
5. Create a **Bug** on project RAW (next-gen). Summary must start with `[Throughline]`. Add label `throughline-workshop`. The Labels field exists. Priority exists on Bug. There is no Track custom field: put Track (Backend, Frontend, or Full-stack) in the description. Reporter is required on RAW; let Jira set it to the signed-in user. Do not create Epics or Subtasks.
6. Ask them to attach a screenshot on the Jira issue page. Do not depend on MCP for the upload.
7. If Jira MCP is unavailable, print paste-ready markdown for the RAW Create Issue screen.

## Good vs bad

Bad: "The heatmap looks wrong."

Good: "On /demand, click the Phoenix city chip. Demand by ZIP shows four rows but the map still shows dots for Atlanta, Denver, and other cities. Expected: only Phoenix ZIPs appear on the map when filtered."
