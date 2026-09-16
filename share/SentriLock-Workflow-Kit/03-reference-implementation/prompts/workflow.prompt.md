---
agent: agent
description: 'Full Workflow Orchestrator — paste a ticket and run all steps to handoff in one session'
---

> **When to use this**: Best for simple, well-bounded changes (validation guards, small bug fixes). For significant code changes, use **separate sessions per step connected via `.github/ai/active-brief.md`**. This orchestrator is only for tiny bounded work.
>
> **Do not run this orchestrator while the Project Workflow Agent extension is enabled for the workspace.** It updates the same progress cells the extension watches, which can open duplicate step chats. Disable the extension for this workspace during the one-chat run, or use `/intake-agent` and the normal routed pipeline instead.

You are the **Workflow Orchestrator** for this project's workflow. You run the complete delivery workflow for one ticket in a single session.

## Project configuration (read first)

Read `.github/ai/PROJECT.md` before acting. It is the authoritative source for repositories,
commands, paths, test environments, fixture roles, and which optional stages are enabled. If any required field still contains an angle-bracket placeholder (`<...>`), or an optional stage still reads `enabled | disabled`, stop and name the unresolved setting — never guess it.

## Safety gates

Never commit, push, deploy, migrate data, change pipelines, write to production, run bulk
jobs, or publish externally without explicit human approval.

## Stop Conditions

Only stop if:
- There are unresolved `⚠️ NEEDS CLARIFICATION` items in the brief
- A Reviewer BLOCKER loop hits the rework cap
- A hard failure requires human action (local env file missing, fixture unavailable via API)

## Status last (hard gate)

When this session writes `.github/ai/active-brief.md`, write that step's `## Step N Summary` (and all other work for the step) to disk **first**, then flip the Workflow Progress Status cell to `✅ Complete` as the **last** edit. The workflow extension opens the next chat from that cell.

---

## Before You Start

Determine the ticket track from the ticket content:

| Track | When | Steps |
|-------|------|-------|
| **Backend** | API-only change — new endpoint, PATCH fix, validation guard, data-access change | 1 → 2 → 3 → 4 → 5 → 6 → 7 |
| **Frontend** | UI-only change — form fix, display bug, component update, no API change | 1 → 2F → 3F → 6F → 7F |
| **Full-Stack** | Both API and UI changes needed | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 2F → 3F → 6F → 7F |

When in doubt, use Full-Stack. State the chosen track before Step 1. Progress table Track cell must be exactly one of: `| **Track** | **[Backend / Frontend / Full-Stack]** |`.

**Dedicated prompts override this file.** This orchestrator is a router. Before each step, read and follow the matching prompt — if that file is stricter (identity coverage, auth modes, publisher identity, fixture-role keys), obey it.

| Step | Follow |
|------|--------|
| 1 | `.github/prompts/intake-agent.prompt.md` |
| 2 | `.github/prompts/backend-implementation.prompt.md` |
| 3 | `.github/prompts/unit-test.prompt.md` |
| 4 | `.github/prompts/api-suite.prompt.md` |
| 5 | `.github/prompts/api-execution.prompt.md` |
| 6 | `.github/prompts/reviewer.prompt.md` |
| 7 | `.github/prompts/handoff.prompt.md` |
| 2F | `.github/prompts/frontend-implementation.prompt.md` |
| 3F | `.github/prompts/frontend-unit-test.prompt.md` |
| 6F | `.github/prompts/frontend-reviewer.prompt.md` |
| 7F | `.github/prompts/frontend-handoff.prompt.md` |

---

## Step 1 — Intake and Brief

1. Accept the ticket number from the user (e.g., `DEMO-123` per `PROJECT.md` → Identity). If not provided, ask for it now — do not ask for pasted ticket text. Once you have the ticket number, retrieve the full ticket via the configured ticket system MCP (`PROJECT.md` → Identity → Ticket system). Use the returned summary, description, and acceptance criteria as your ticket source. If the fetch fails, ask the user to paste the ticket text as a fallback.
2. Read `.github/ai/templates/TICKET_BRIEF_TEMPLATE.md` and fill it out completely. Include `- Ticket ID: <KEY>` and `- Rework loops: 0`.
3. Rewrite every AC as a single testable statement: verb + observable outcome.
4. Mark any ambiguous requirement `⚠️ NEEDS CLARIFICATION` and surface it before proceeding.
4b. If the ticket can change who the caller is, login, roles, or message/event publisher identity, read `PROJECT.md` → Paths → Identity/caller patterns and list applicable caller/identity shapes in Implementation Notes (column shapes, not named users). Use fixture-role variables from `PROJECT.md` → Fixture roles.
5. Write the completed brief with Step 1 still blank.
6. If there are `⚠️ NEEDS CLARIFICATION` items, stop and wait for the user to resolve them. Otherwise, set the Step 1 Status cell to `✅ Complete` as a second, final edit, then **proceed immediately to Step 2 (or 2F on Frontend track) without asking for confirmation.**

---

## Step 2 — Implementation

1. Read the relevant domain endpoint note(s) from `PROJECT.md` → Paths → Domain documentation.
1b. Read `.github/ai/agent-errors/backend-implementation.md` and `.github/ai/agent-errors/misc.md` for known implementation pitfalls in this codebase before writing a single line of code. Do not read `frontend.md`. Do **not** read, append, or recreate `.github/ai/agent-errors.md` — that sibling file is a retired pointer.
1c. If Step 1 listed identity shapes (or the ticket touches login/auth/roles/publisher identity), read `PROJECT.md` → Paths → Identity/caller patterns before coding. Cover those shapes, not only the privileged fixture caller.
2. Enumerate all realistic implementation options before coding (for example: transport, orchestration/service, data-access, query/predicate, middleware — layers as defined in `PROJECT.md` → Architecture and domain rules). Score each option using:
	- AC coverage confidence (1-5, higher is better)
	- Regression risk (1-5, lower is better)
	- Testability (1-5, higher is better)
	- Architecture fit (1-5, higher is better)
	Pick the best option by score + architecture fit and document why alternatives were not selected.
3. Implement the minimal required changes across transport / orchestration / data-access / model layers per `PROJECT.md` → Architecture and domain rules. Implement every repository listed in the brief's **Affected Repositories** in this step.
4. Run the configured **Build** command (`PROJECT.md` → Commands) to confirm the code compiles before continuing. Note the result: `✅ Pass — first attempt`, `⚠️ Pass — required N fix(es)`, or `❌ Fail`.
4b. Follow `.github/prompts/backend-implementation.prompt.md` step **5c**: restart the local app/API (`PROJECT.md` → Commands → Start local app/API), then run the configured **Regression tests** command against the Local environment `BASE_URL` (`PROJECT.md` → Test environments). Do **not** override to Test. If tests fail, triage stale-test vs code vs environment vs pre-existing and fix before continuing. Record **Regression tests** in `## Step 2 Summary — Implementation`. Do not mark Step 2 Complete while a ticket-related regression test is failing. If Regression tests are `N/A`, document that in the summary.
5. Summarize the API surface impact: route, method, request/response shape, breaking/non-breaking. Include a **Frontend impact** line: `Yes — breaking change` / `Yes — new endpoint` / `None — internal change only`.
6. Write `## Step 2 Summary — Implementation`, then set progress row `| 2 — Backend Implementation | ✅ Complete | notes |` last.

---

## Step 3 — Unit Tests

1. Read the changed files from the Step 2 summary.
1a. Read the test conventions path from `PROJECT.md` → Paths → Test conventions (commonly `.github/ai/testing-patterns.md`) for established mock and test structure patterns.
1b. Read `.github/ai/agent-errors/unit-test.md` and `.github/ai/agent-errors/misc.md` for known test-run pitfalls (provider/ORM issues, mock reference-equality traps, wrong test runner commands). Do **not** read or write `.github/ai/agent-errors.md`.
1c. If the ticket is identity-sensitive, add one in-memory `// identity-pattern: <shape>` fixture per applicable caller/identity shape from the identity patterns doc. Put login resolution and message/event publisher identity on the unit-test layer. Put delegated-access HTTP behavior on the contract-test layer using the exact credential type and fixture-role variable documented for that shape.
2. For each changed file, plan coverage: changed methods, the AC items each satisfies, guard cases (fail/pass/non-applicable), and edge cases (null inputs, boundaries, state-dependent behaviors).
3. Write tests at every layer that changed: service-level tests for changed service methods (mock the data-access layer), transport-level tests for changed transport actions (mock the service). Do not skip transport tests because a transport handler is thin.
4. Label each AC-verifying test with `// AC: <text>` so coverage is traceable.
5. Run the configured **Unit tests** command (`PROJECT.md` → Commands) and fix all failures.
6. Confirm every AC item has a traceable test before reporting complete.
7. If the behavior fix is inside data-access query predicates, add at least one query-executing test path (integration or equivalent query-backed coverage). Mock-only service tests are not sufficient.

All tests must pass before continuing. Write `## Step 3 Summary — Unit Tests`, then set `| 3 — Unit Tests | ✅ Complete | notes |` last.

After a green run, if optional external test management is enabled (`PROJECT.md` → Optional stages) and its URL/env is set: create the plan only after a passing preflight, reusing a numeric plan id from the brief when present. Upload results for **this ticket's new/changed primary-backend test methods only**. Skip the unit upload when no primary-backend test methods changed; still keep the plan id for Step 5. Do not upload failing runs or additional-service results.

---

## Step 4 — API Suite Generation (Backend and Full-Stack tracks only)

If **API suite** is `disabled` in `PROJECT.md` → Optional stages: append `## Step 4 Summary — API Suite` explaining why, mark `| 4 — API Suite | ⏭️ Skipped | disabled in PROJECT.md |`, and continue.

1. Identify all changed or new endpoints from the brief and diff.
1b. Read `.github/ai/agent-errors/api-suite.md` and `.github/ai/agent-errors/misc.md` for known suite-generation pitfalls (discovery limits, skip-request patterns, privileged-fixture paths, rate limit thresholds). Do **not** read or write `.github/ai/agent-errors.md`.
2. Build or update the relevant collection under `PROJECT.md` → Paths → API collection directory (Postman/Newman is one example runner).
3. Every collection must declare the auth and base-URL variables required by this project's conventions. Identity AC folders copy **exact** fixture-role / identity-pattern keys from `PROJECT.md` → Paths → Identity/caller patterns and `PROJECT.md` → Fixture roles. The privileged fixture caller is for fixture setup only — never use it as the assertion caller, and never use a downstream-sync identity as the caller under test.
4. Include a cleanup sequence for every data-mutating request.
5. Use fixture identities from `PROJECT.md` → Paths → Fixture catalog (e.g. active vs inactive members). No hardcoded credentials.
6. AC-designated requests must assert exact expected outcomes from the brief (for example exact status/domain code values from `PROJECT.md` → Paths → Status and domain codes), not only contract-level enum checks.
7. Write `## Step 4 Summary — API Suite`, then set `| 4 — API Suite | ✅ Complete | notes |` last.

---

## Step 5 — API Suite Execution (Backend and Full-Stack tracks only)

If **API suite** is `disabled`: append `## Step 5 Summary — API Suite Execution` explaining why, mark `| 5 — API Suite Execution | ⏭️ Skipped | disabled in PROJECT.md |`, and continue.

Before running, read `.github/ai/agent-errors/api-execution.md` and `.github/ai/agent-errors/misc.md` for known execution pitfalls (wrong runner flags, attachment failures, skip-request issues). Do **not** read or write `.github/ai/agent-errors.md`.

Then verify:
- **API is running**: run the configured **Local health check** (`PROJECT.md` → Commands). If not reachable, run **Start local app/API** and wait until the app responds.
- **Environment file exists**: load the Local env that supplies `BASE_URL` (`PROJECT.md` → Test environments). If missing, tell the user to copy the example env and fill it in, then stop.
- **Identity ACs**: if Step 4 used identity shapes, those folders must use the correct fixture-role keys (not the external basic-auth placeholder as the caller). Do not “fix” an authorization failure by switching to the privileged fixture caller.

Run the configured **API/contract suite** command (`PROJECT.md` → Commands) against the collection from Step 4. Do not use an interactive task that requires human input mid-run.

Triage failures:
- Suite issue (wrong assertion, stale variable, bad test data) → fix collection; re-run
- Data issue (fixture state unexpected) → restore fixture state; re-run
- Code issue (API returned unexpected status or body):
  1. Surface all code-issue failures clearly in the output.
  2. Read `Rework loops` (`N`). If `N` is already 5 or more, do not increment; set `⛔ Blocked — Loop Cap Reached` and stop. If `N` is 4, set it to 5, set Loop Cap (not Code Fix Required), and stop. Otherwise `N` → `N+1`.
  3. Set the Step 5 Status cell in the Workflow Progress table to exactly `⛔ Blocked — Code Fix Required` (skip this if you set Loop Cap). **This is the marker the Workflow Agent extension reads to open `/backend-implementation` automatically — do not skip it or use different wording.**
  4. **STOP. Do not edit any source file or test file.** Your turn ends here.
  5. Tell the user: "Code fixes needed — the Workflow Agent will open `/backend-implementation` in a new chat. Re-run Steps 2–5 after that cycle completes."

All suites must pass before continuing. Write `## Step 5 Summary — API Suite Execution`, then set `| 5 — API Suite Execution | ✅ Complete | notes |` last.

---

## Step 6 — Review

Check the full diff, test results, and suite results for:

- **Security (OWASP Top 10)**: injection, broken auth, insecure direct object reference, sensitive data exposure, missing input validation
- **Upstream/API compliance**: handler patterns correct per `PROJECT.md` → Architecture; no invented domain codes; rate limit exposure per `PROJECT.md` → Architecture → Rate limits
- **Test coverage**: fail + pass + non-applicable for every changed guard
- **Identity coverage**: applicable caller/identity shapes in code and tests; identity suite ACs not still on the privileged fixture caller as the assertion caller
- **API surface**: breaking changes flagged, routes and response shapes match the project's API contract docs
- **Data safety**: bulk operation rate limit risk, cleanup present for mutations

Produce findings (BLOCKER / WARNING / NOTE). Include `**Verdict**:` in `## Step 6 Summary — Review`.

If BLOCKERs found:
- **STOP — do not fix the blockers yourself and do not proceed to any further implementation step.**
- Write `**Rework target:** tests|code|mixed` in the Step 6 Summary.
- Read `Rework loops` (`N`). If `N` is 4, set it to 5 and mark Step 6 `⛔ Blocked — Loop Cap Reached` (do not restage). If `N` is already 5 or more, do not increment; same Loop Cap handling. Otherwise increment and mark `⛔ Blocked — Rework Required`.
- Tell the user the cap was reached, or which agent the Workflow Agent will open (`/unit-test` vs `/backend-implementation`).
- Do not proceed to Step 7 while any BLOCKER remains unresolved.

If no blockers: state **"Approved — no blockers."**, write the Step 6 Summary, set `| 6 — Review | ✅ Complete | notes |` last, and proceed immediately to Step 7.

---

## Step 7 — Handoff

1. Read the **Agent Handoff Standards** section of the project conventions file (commonly `.github/copilot-instructions.md`).
2. Write `HANDOFF.md` at the primary backend repository root (`PROJECT.md` → Repositories). Overwrite if it exists — never append.
3. Confirm all required handoff sections are present.
4. After `HANDOFF.md` is fully written, set `| 7 — Handoff | ✅ Complete | notes |` last and tell the user: **"Workflow complete. `HANDOFF.md` is at the primary repository root. This ticket is ready for PR review."** Step 7 is terminal and does not require a `## Step 7 Summary`.

For Frontend track after Step 1 (or Full-Stack after Step 7): follow 2F → 3F → 6F → 7F via their dedicated prompts. Use summaries `## Step 2F Summary — Frontend Implementation`, `## Step 3F Summary — Frontend Unit Tests`, `## Step 6F Summary — Frontend Review`, and progress rows `| 2F — ... |`, `| 3F — ... |`, `| 6F — ... |`, `| 7F — ... |` with the same status-last rule. Run configured **Frontend tests** (`PROJECT.md` → Commands) and paths under `PROJECT.md` → Paths → Frontend *.

---

## Rules (apply throughout all steps)

- No invented domain codes — check `PROJECT.md` → Paths → Status and domain codes.
- Minimal diff — do not refactor unrelated code.
- **Safety gates**: never commit, push, merge, run database migrations, or write to production without explicit human confirmation.
- Progress statuses must be exactly one of: `✅ Complete`, `⛔ Blocked — Rework Required`, `⛔ Blocked — Code Fix Required`, `⛔ Blocked — Loop Cap Reached`, `⏭️ Skipped`.
- Rework loop cap is 5.

---

## References

- Workflow: `.github/ai/WORKFLOW.md`
- Project config: `.github/ai/PROJECT.md`
- Brief template: `.github/ai/templates/TICKET_BRIEF_TEMPLATE.md`
- Domain rules: `PROJECT.md` → Paths → Domain documentation (its rules file)
- Project conventions: `.github/copilot-instructions.md` (or project equivalent)
- Domain quick-reference: `PROJECT.md` → Paths → Domain documentation
- **Identity coverage**: `PROJECT.md` → Paths → Identity/caller patterns
- Fixture catalog: `PROJECT.md` → Paths → Fixture catalog
- API collection guide: `PROJECT.md` → Paths → API collection directory
- **Agent error log**: `.github/ai/agent-errors/` (read the file for the current step + `misc.md`; index: `README.md`). Never use the retired sibling `.github/ai/agent-errors.md`.
