# Operator manual — Dev pipeline

Start: **Project Workflow: Start Dev Ticket** (or `/intake-agent KEY`).

| Step | Slash | Writes | Human |
|------|-------|--------|-------|
| 1 | `/intake-agent` | `active-brief.md` | Confirm ACs / track; resolve NEEDS CLARIFICATION |
| 2 | `/backend-implementation` | Code, Step 2 Summary | Safety gates; project-specific data work |
| 3 | `/unit-test` | Tests and result evidence | — |
| 4 | `/api-suite` | Contract-test artifact and fixture plan | Approve any direct data setup |
| 5 | `/api-execution` | Suite results; or **stop** on product bug | Confirm target environment |
| 6 | `/reviewer` | Findings; may block | Decide WARNINGs |
| 7 | `/handoff` | `HANDOFF.md`, eval row | Approve external updates; create PR yourself |

Frontend: `/frontend-implementation` → `/frontend-unit-test` → `/frontend-reviewer` → `/frontend-handoff`.

## Status last

Every prompt: write `## Step N Summary`, **then** flip `✅ Complete`. The driver also requires the heading.

## Rework

Reviewer writes `**Rework target:** tests|code|mixed` and increments `Rework loops`.  
Suite code bugs: `⛔ Blocked — Code Fix Required` on Step 5 — executor does **not** edit product code.

Cap 5 → investigate by hand, then Open Next Step.

## Do not

Use a separate Agent chat for each step on a real ticket; the extension carries state through
`active-brief.md` and opens the next prompt. `/workflow` is only for tiny, well-bounded changes,
and the extension must be disabled for the workspace during that one-chat run to avoid duplicate chats.
