# Agent Catalog for this project's workflow

Use these roles as separate chat modes or explicit prompt templates. Keep each agent focused and narrow.

Read `.github/ai/PROJECT.md` before acting. It is the authoritative source for repositories, commands, paths, test environments, fixture roles, and which optional stages are enabled. If any required field still contains an angle-bracket placeholder (`<...>`), or an optional stage still reads `enabled | disabled`, stop and name the unresolved setting — never guess it.

The Workflow Progress `✅ Complete` cell opens the next agent. Every agent writes that cell **last**, after its Step N Summary and all other work. See **Status last** in `WORKFLOW.md`.

Agent pitfalls live in `.github/ai/agent-errors/` (not a single file). Every agent reads **its file plus `misc.md`**. See `agent-errors/README.md`. Frontend agents use `frontend.md` + `misc.md`; backend agents use their step file + `misc.md`. Do not mix frontend and backend files. Do **not** read, append, or recreate `.github/ai/agent-errors.md` — that path is a retired pointer.

## Tracks

| Track | When | Steps |
|-------|------|-------|
| **Backend** | API-only change | 1 → 2 → 3 → 4 → 5 → 6 → 7 |
| **Frontend** | UI-only change | 1 → 2F → 3F → 6F → 7F |
| **Full-Stack** | Both API + UI | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 2F → 3F → 6F → 7F |

The brief records the track as `| **Track** | **[Backend / Frontend / Full-Stack]** |`.

## 1) Ticket Intake Agent

Mission:
- Convert a ticket plus its comments into a strict implementation brief.

Inputs:
- Ticket metadata from the configured ticket system (`PROJECT.md` → Identity → Ticket system)
- Description and acceptance criteria
- Linked issues and attachments

Outputs:
- Brief with assumptions, non-goals, and risk tags
- `- Ticket ID: <KEY>` and the track cell filled in
- Acceptance criteria checklist

Quality bar:
- No ambiguous AC wording
- Every AC is testable
- Identity-sensitive tickets list the applicable caller/identity shapes from the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns) and which layer proves each one (unit test vs API suite vs live HTTP). Do not write external identity-provider code exchange or message-publisher identity as suite-only ACs.

## 2) Backend Implementation Agent

Mission:
- Implement orchestration, transport, data-access, and model changes with a minimal diff, in the layers defined in `PROJECT.md` → Architecture and domain rules.

Inputs:
- Completed ticket brief with no unresolved clarification items
- Domain documentation notes and endpoint examples (`PROJECT.md` → Paths → Domain documentation)
- Existing project conventions

Outputs:
- Code changes in **every** repository listed in the brief's Affected Repositories
- Updated existing regression suite (`PROJECT.md` → Commands → Regression tests) when the ticket changed the HTTP contract those tests assert
- Passing local regression run (or documented environment / pre-existing-only failures)
- List of API surface impacts
- `## Step 2 Summary — Implementation`

Quality bar:
- No business logic leaks into the transport layer
- Validation guards covered by tests
- Identity/auth/publisher tickets cover the applicable caller shapes, not only the privileged fixture caller
- Regression scan completed (alternate verbs/routes, siblings, call sites) and recorded in the Step 2 Summary
- Existing regression tests run against the **Local** environment (`PROJECT.md` → Test environments) before Complete; failures triaged (stale test vs code vs environment) and fixed in this step

## 3) Unit Test Agent

Mission:
- Add or improve tests focused on regressions and edge cases.

Inputs:
- Code diff
- Acceptance criteria
- Existing test patterns in the configured unit test suite (`PROJECT.md` → Paths → Unit test project/suite)

Outputs:
- Added/updated tests
- Coverage notes by behavior
- `## Step 3 Summary — Unit Tests`
- When the optional external test management system is enabled (`PROJECT.md` → Optional stages), a test plan plus **ticket-scoped** results for the methods added or changed this step. Sibling-repository suites and the rest of the existing suite are not uploaded. If it is disabled, say so in the summary rather than inventing an integration.

Quality bar:
- Includes fail case + pass case + non-applicable case where relevant
- Every repository Step 2 changed has tests in that repository's own test suite
- Login/identity diffs exercise the real resolver path for each applicable caller shape, including the synthetic/stub identity variant and the publisher-identity capture

## 4) API Suite Agent

Mission:
- Generate and update the configured API/contract suite (`PROJECT.md` → Commands → API/contract suite; Postman/Newman is one example runner).
- Run all required local fixture-discovery and endpoint-validation commands autonomously without discretionary approval prompts.

Inputs:
- Changed endpoints
- Required variables and auth
- Data cleanup strategy

Outputs:
- Updated collection(s) in the configured collection directory
- Variable contract
- Cleanup sequence
- `## Step 4 Summary — API Suite`

Quality bar:
- Suites are deterministic and rerunnable
- Data mutations are reverted
- Discovery is bounded (no unbounded record scans; cap candidate scans at 100 IDs per run)
- Identity ACs copy exact fixture-role variable names from `PROJECT.md` → Fixture roles and the identity patterns doc — do not invent a variable that is not in that map; the privileged fixture caller is setup only
- If the API suite stage is `disabled` in `PROJECT.md`, append the Step 4 summary explaining why and mark the row `⏭️ Skipped` rather than inventing a test stack

## 5) API Execution Agent

Mission:
- Execute generated suites and report actionable failures.
- Run all required local execution commands autonomously (build/restart/health/suite/process control) without asking for discretionary user approval.

Inputs:
- Suite files
- Local variable values
- Running local app/API (`PROJECT.md` → Commands → Start local app/API)

Outputs:
- Pass/fail report
- Root cause triage (suite issue vs code issue vs data issue)
- `## Step 5 Summary — API Suite Execution`

Quality bar:
- Repro command is included
- Failure logs point to request/assertion names
- Execution flow is end-to-end with no avoidable approval pauses
- An identity AC returning 401 while its setup requests passed is a suite issue — do not switch the AC to the privileged fixture caller
- If the stage is `disabled` in `PROJECT.md`, mark the row `⏭️ Skipped` and explain why in the summary

## 6) Reviewer Agent

Mission:
- Perform risk-focused review before merge/handoff.

Inputs:
- Full diff
- Test results
- API suite results

Outputs:
- Findings by severity (BLOCKER / WARNING / NOTE)
- Required changes
- Residual risk note
- `## Step 6 Summary — Review` with `**Verdict**:`
- When blocked: `**Rework target:** code|tests|mixed` so the extension opens the right agent

Quality bar:
- Findings are concrete, not generic style comments
- Identity-sensitive diffs missing an applicable caller shape, or identity suite ACs still running as the privileged fixture caller, are BLOCKERs
- Independently re-runs the implementation regression scan; in-scope unfixed siblings are BLOCKERs (a missing scan section alone is a WARNING)
- Audits the Step 2 **Regression tests** section (local run + triage); leftover stale regression assertions after a contract change are BLOCKERs (`code`)
- Blocked verdicts use `⛔ Blocked — Rework Required` or `⛔ Blocked — Code Fix Required`; the rework loop cap is 5, after which the row is `⛔ Blocked — Loop Cap Reached` and a human decides

## 7) Handoff Agent

Mission:
- Write `HANDOFF.md` for continuity to the next agent.

Inputs:
- Final diff
- Test and suite run summaries
- Open items

Outputs:
- Complete handoff with pending checklist items
- Appended scorecard entry in `.github/ai/EVAL_LOG.md`

Quality bar:
- A new agent can continue work without additional user context
- Identity-sensitive tickets list the caller shapes tested and the exact fixture-role variable keys used in the suite, not privileged-caller-only evidence

---

## Frontend Agents

## 2F) Frontend Implementation Agent

Mission:
- Implement UI changes in the frontend repository (`PROJECT.md` → Repositories) based on the active brief.

Inputs:
- Active brief (AC list, track classification)
- `HANDOFF.md` from Step 7 (if full-stack)
- Domain documentation (endpoint docs, domain codes)

Outputs:
- Code changes in the frontend repository
- `## Step 2F Summary — Frontend Implementation` (changed files, components, routes, state changes, regression scan, browser verification result)

Quality bar:
- Follows existing code patterns — no refactoring
- API calls use the existing client and auth pattern already in the repository
- Field names match the project's API naming/serialization convention (`PROJECT.md` → Architecture)
- No new production dependencies without justification
- Regression scan completed; browser verification pass follows `.github/ai/FE_PLAYWRIGHT.md`

## 3F) Frontend Unit Test Agent

Mission:
- Write frontend tests for every component/file changed in Step 2F, using the configured Frontend tests command.

Inputs:
- Step 2F Summary (changed files)
- Existing test utilities in the frontend repository
- Domain documentation for mock data

Outputs:
- Test files beside the source, following the repository's existing test layout
- All tests passing
- `## Step 3F Summary — Frontend Unit Tests`

Quality bar:
- Tests behavior, not implementation
- Real field names and domain codes in mocks
- At least one error/edge case per component

## 6F) Frontend Reviewer Agent

Mission:
- Risk-focused review of frontend changes before handoff.

Inputs:
- Diff of frontend changes
- Step 2F + 3F summaries

Outputs:
- Findings by severity (BLOCKER / WARNING / NOTE)
- `## Step 6F Summary — Frontend Review` with `**Verdict**:` and, when blocked, `**Rework target:** code|tests|mixed`

Quality bar:
- Security checked (injection/XSS, credential exposure)
- Framework best practices validated
- API integration correctness verified
- Test coverage confirmed
- Independently re-runs the frontend regression scan
- Browser verification pass follows `.github/ai/FE_PLAYWRIGHT.md`

## 7F) Frontend Handoff Agent

Mission:
- Write `HANDOFF.md` summarizing frontend changes for continuity.

Inputs:
- All frontend step summaries
- Diff
- Build verification

Outputs:
- Complete `HANDOFF.md` with frontend-specific sections

Quality bar:
- Configured frontend build command succeeds
- All tests pass
- A new agent can continue without additional context

---

## Recommended Orchestration Pattern

**Backend track:**
1 → 2 → 3 → 4 → 5 → 6 → 7

**Frontend track:**
1 → 2F → 3F → 6F → 7F

**Full-Stack track:**
1 → 2 → 3 → 4 → 5 → 6 → 7 → 2F → 3F → 6F → 7F

Escalation rule:
- If AC are ambiguous or the ticket system is inaccessible, return control to the human before implementation steps.

## QA Pipeline Agents

After the dev workflow completes, QA agents generate regression tests and smoke checks for the deployed API. See `.github/ai/QA_AGENT_CATALOG.md` for QA agent roles and `.github/ai/QA_WORKFLOW.md` for the QA step definitions. Skip the pipeline entirely when Post-deploy QA is `disabled` in `PROJECT.md`.

QA agents: `/qa-intake`, `/qa-test-generator`, `/qa-smoke-builder`, `/qa-report`
QA orchestrator: `/qa-workflow`

One-chat orchestrators (`/workflow`, `/qa-workflow`) are alternatives to extension routing, not
wrappers around it. Disable the extension for the workspace while using one.
