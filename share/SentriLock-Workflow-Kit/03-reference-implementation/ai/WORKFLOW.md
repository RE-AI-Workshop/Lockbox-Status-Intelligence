# AI Engineering Workflow

This workflow turns tickets into production-ready changes with traceability, tests, and contract validation. It supports three tracks: backend-only, frontend-only, and full-stack.

Project-specific facts — repositories, commands, paths, environments, fixture roles, and which optional stages are enabled — live in `.github/ai/PROJECT.md`. This file describes the process; `PROJECT.md` supplies the values. Agents must never guess a value that `PROJECT.md` leaves as a `<placeholder>`.

## Tracks

| Track | When | Steps |
|-------|------|-------|
| **Backend** | Service/API-only change — new endpoint, data-access fix, validation guard | 1 → 2 → 3 → 4 → 5 → 6 → 7 |
| **Frontend** | UI-only change — form fix, display bug, component update, no API change | 1 → 2F → 3F → 6F → 7F |
| **Full-Stack** | Both API and UI changes needed | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 2F → 3F → 6F → 7F |

The intake agent classifies the track. The workflow extension routes to the correct next step.

**Cursor:** every pipeline step must run with **Agent** capabilities (edit files, run commands, update the brief). The extension opens each step as an Agent chat. Mode rules live in `.github/ai/CURSOR_AGENT_MODE.md`, which is prepended into `.cursor/commands/`: never call `switch_mode`, never ask the user to change modes mid-step, and if Plan mode blocks edits, stop and tell the user to select Agent — do not produce a plan-only checkpoint and call the stage done. Cursor slash chips use Plan-nudge-safe aliases from `.github/ai/cursor-slash-aliases.json` (`/backend-code`, `/frontend-code`, `/api-run`, `/project-flow`, `/qa-flow`), because chip names containing `implementation`, `workflow`, or `execution` flip the UI to Plan as soon as the chip binds.

## Status last (do not skip)

The extension opens the next agent when it sees `✅ Complete` on a step **and** that step's summary heading is already in the brief (`## Step 2 Summary`, `## Step 2F Summary`, and so on). Marking Complete before the summary — or before tests, browser verification, and documentation writes are done — starts the next chat mid-step.

Write Complete as the **last** edit to `active-brief.md` on your step. Prefer two writes: summary first, then the status cell. Nothing-to-do and skip paths still need a one-line Step N Summary before Complete.

- **Step 1:** write the finished brief with the status blank, then set Step 1 Complete in a second,
  final edit after confirming Ticket ID, Track, and all required sections. Do not save a partial brief.
- **Steps 7 / 7F:** no summary heading is required. Finish `HANDOFF.md`, `EVAL_LOG.md`, and the ticket-attach step (or its documented skip) first, then mark Complete.
- **Disabled stages:** when `PROJECT.md` marks an optional stage `disabled`, append a one-line summary explaining why and set the row to `⏭️ Skipped`. Routing treats a skipped row as complete only when its summary exists.

## 1) Intake and Brief

Goal: confirm required access and produce a deterministic implementation brief before any coding begins.

Inputs:
- Ticket details (title, description, acceptance criteria) from the ticket system named in `PROJECT.md`
- Repository code for every repository listed in `PROJECT.md`
- Domain documentation (`PROJECT.md` → Paths → Domain documentation)
- Existing API/contract collections (`PROJECT.md` → Paths → API collection directory)

Required access:
- Read access to the ticket, its comments, attachments, and linked tickets
- Local access to the domain documentation path
- Workspace write access for code, tests, and contract suites

Gate:
- If the ticket system is inaccessible, stop and request one of:
  - A ticket export (markdown or JSON)
  - API token, base URL, and project scope for the ticket system
  - Human-pasted acceptance criteria in chat

Output:
- Completed brief using `.github/ai/templates/TICKET_BRIEF_TEMPLATE.md`:
  - Problem statement
  - Acceptance criteria checklist (binding, behavior-focused)
  - Implementation notes (advisory, non-binding)
  - Affected endpoints and route family (`PROJECT.md` → Architecture → Route families)
  - Solution options analysis (alternatives considered plus selected approach rationale)
  - Risks and non-goals
  - Test plan (unit, integration, contract suite)

Gate:
- Unresolved `⚠️ NEEDS CLARIFICATION` items stop the pipeline. Otherwise the completed brief routes to Step 2 automatically.
- Teams that require a pre-implementation design checkpoint for high-risk tickets must pause or disable automatic routing before Step 1 completes and record that policy in project instructions. The extension does not implement an approval state between Steps 1 and 2.

## 2) Implementation

Goal: implement the minimal code changes that satisfy the acceptance criteria.

Rules:
- Follow the layering recorded in `PROJECT.md` → Architecture and domain rules (transport → orchestration → data access → models)
- Keep the transport layer thin; place orchestration in the service layer
- Preserve the API naming and serialization convention from `PROJECT.md`
- Do not refactor unrelated code; minimal diff only
- Before coding, evaluate all realistic implementation locations and select using a fixed rubric: AC coverage confidence, implementation safety, testability, architecture fit, future capability enablement
- Intake's code-level clues are advisory. Implementation may diverge when a different option better satisfies the ACs, reduces risk, or enables valid future functionality — document the rationale in the Step 2 Summary
- If options tie, choose the layer where the invariant naturally lives and record the tie-break rationale
- Implement every repository listed in the brief's **Affected Repositories** in this same step; never defer a sibling repository to a follow-up
- Identity, auth, and publisher-identity tickets: read the identity/caller patterns doc (`PROJECT.md` → Paths) and cover every applicable caller shape, not just the privileged happy path. List the shapes covered in the Step 2 Summary
- After coding, run the **regression scan**: alternate verbs and routes, same-file siblings, call sites, cross-repository consumers. Fix in-scope gaps, document out-of-scope siblings, and record the scan plus Step 3 scenarios in the Step 2 Summary
- After a successful build, run the configured **Regression tests** command against the **Local** environment (`PROJECT.md` → Test environments) — never against a deployed environment. Triage each failure as stale test (the AC intentionally changed the contract, so fix the test), code bug (fix production code), environment/harness, or unrelated pre-existing. Do not mark Step 2 Complete while a ticket-related regression failure is open

Output:
- Code diff
- Initial unit tests for changed behavior (correctness-focused; Step 3 verifies completeness)
- Updated regression tests when the ticket made existing assertions incorrect
- Regression run result (pass/fail/skip plus triage) in the Step 2 Summary
- API surface impact list (route, method, request/response shape, breaking or non-breaking)
- Option analysis record (alternatives plus why the selected approach is best)
- Notes on any assumptions

## 3) Unit Tests

Goal: quality gate on coverage — verify and complete every changed guard, business rule, and data path. This is a review and completion pass, not a reimplementation of Step 2's tests.

Rules:
- Tests live in the unit test project from `PROJECT.md` → Paths, mirroring the unit under test. If Step 2 also changed a sibling repository, tests for those changes live in that repository's test project and must be written in this same pass
- For every validation guard: fail case, pass case, and non-applicable case
- Use real field names and real domain codes from the domain documentation
- When behavior changes inside a query or predicate, include coverage that executes the real query path. Mock-only service tests are not sufficient for predicate correctness
- Identity and auth tickets: one fixture per applicable caller shape, annotated with the shape id. A single privileged happy path is not coverage
- All tests must pass before proceeding
- If the configured test command aborts for an environment reason (missing runtime, tooling mismatch), fix or retry the run and record what happened. Never cite an earlier run's results when the current run failed to execute — see `agent-errors/unit-test.md`
- If tests expose a production bug rather than a test gap, set Step 3 to `⛔ Blocked — Code Fix Required` and stop. Routing returns to implementation

Output:
- Added and updated test files, per repository
- Final counts (passed / failed / skipped), per repository
- When external test management is enabled in `PROJECT.md`, a ticket-scoped run containing only the methods added or changed in this step

## 4) API Suite Generation

Optional stage — skip with `⏭️ Skipped` and a summary when `PROJECT.md` sets **API suite** to `disabled`.

Goal: generate or update contract suites for changed endpoints, with all required fixture data verified or created before writing a single request.

Runner: the configured **API/contract suite** command and collection directory (`PROJECT.md`). Postman with Newman is one common choice.

Rules:
- Default to the internal route family; use the external family only when explicitly validating external-caller behavior (`PROJECT.md` → Architecture → Route families)
- Include cleanup requests for every data-changing sequence — create, assert, delete
- AC-designated assertions must validate the exact expected outcome from the brief, not enum-only or shape-only checks
- **Fixture data responsibility lives here, not in Step 5.** Before writing the collection:
  1. Verify by read request that all required fixtures exist and are in the expected state
  2. If a fixture is missing or wrong, create or correct it through the API and add those calls to the pre-flight folder
  3. If a fixture cannot be created through the API, output the exact statements the human would need to run and pause for explicit confirmation — never run direct data modification yourself
- Identity-sensitive endpoints: copy the exact fixture-role variable keys from `PROJECT.md` → Fixture roles and the identity patterns doc. Never invent a key. The privileged account is fixture setup, not caller coverage

Output:
- Updated suite file(s)
- Variables required for local execution
- Expected pass criteria
- Summary of every fixture verified or created

## 5) API Suite Execution Gate

Optional stage — skip with `⏭️ Skipped` and a summary when the API suite stage is disabled, or when Step 4 was skipped.

Goal: prove the generated suites pass against the **Local** environment. The executor does not hunt for data — all fixtures were confirmed in Step 4.

Execution mode:
- Treat the configured local build, start, health-check, and suite commands as pre-approved and run them without asking for discretionary approval
- Do not pause between build, restart, health, and suite steps unless a gate condition fails

Prerequisites:
- The local app or API is running (`PROJECT.md` → Commands → Start local app/API)
- Environment variables set for `BASE_URL` and the fixture-role keys from `PROJECT.md` → Fixture roles

Pass criteria:
- All targeted suites return passing assertions
- Any intentional skips are documented with reasons

Fail criteria handling:
- Suite issue (wrong assertion, stale variable, bad request shape) → fix the collection and re-run
- Data issue (a fixture Step 4 should have verified) → surface it to the user and regenerate the suite with `/api-suite`; do not hunt for substitute data
- Code issue (the API returned the wrong status or body) → surface the findings, set Step 5 to `⛔ Blocked — Code Fix Required`, and **stop**. The executor never edits product code. Routing returns to `/backend-implementation`, then the pipeline replays 2 → 3 → 4 → 5

## 6) Review

Goal: risk-focused review before handoff.

Checklist:
- Behavioral regressions
- Missing edge-case tests
- Route and auth mismatches across route families
- Breaking changes in request or response shape
- Missing cleanup for data-mutating tests
- Options-analysis completeness for multi-path fixes (alternatives, rubric scores, selected rationale)
- Selected layer fit versus where the invariant actually lives
- Identity and auth coverage: every applicable caller shape covered in code and tests, and identity ACs not still asserting as the privileged fixture account
- **Regression scan audit**: independently re-scan alternate entry points and siblings. A missing **Regression scan** section is a WARNING; an in-scope sibling left broken is a BLOCKER
- **Regression test gate audit**: the Step 2 Summary must include **Regression tests** with the local run and triage. Stale assertions left after an intentional contract change are a BLOCKER (`code`). Do not re-run the full suite during review

Output:
- Findings ordered by severity (BLOCKER / WARNING / NOTE)
- Required changes list
- Step 6 status handling:
  - Approved, no blockers → `✅ Complete`
  - Blockers found → `⛔ Blocked — Rework Required`
  - Never `✅ Complete` while blockers are unresolved

Loop-back (owned by the extension, not the reviewer):
- The reviewer writes `⛔ Blocked — Rework Required`, `**Rework target:** code|tests|mixed`, increments `Rework loops`, and blanks later step statuses **in one brief write**
- **tests** → the extension opens `/unit-test`; the pipeline continues 3 → 4 → 5 → 6
- **code** or **mixed** → the extension opens `/backend-implementation`; the pipeline continues 2 → 3 → 4 → 5 → 6
- The extension opens each rework agent **once** per incremented loop, and does not open implementation while `Rework loops` is still 0
- **WARNING** → the developer decides; document any deferral in `HANDOFF.md` open items
- **NOTE** → optional improvement; proceed to Step 7

Hard gate:
- A missing options analysis on a multi-path ticket, or inconsistent layer selection without rationale, is a **BLOCKER**

## 7) Handoff Artifact

Goal: produce a complete continuation file for the next agent or human.

Write `HANDOFF.md` at the repository root with:
- Task context and acceptance criteria status
- Files changed table
- API surface changes
- Test status
- Next explicit actions
- Open caveats

Append the scorecard row to `.github/ai/EVAL_LOG.md`. Creating a pull request, pushing, or attaching results to the ticket requires explicit human approval.

## 2F) Frontend Implementation

Goal: implement the minimal UI changes that satisfy the frontend acceptance criteria.

Rules:
- Read `HANDOFF.md` from Step 7 (full-stack tickets) to understand API changes before starting
- Follow the existing patterns in the file being modified — no refactoring
- Components stay presentation-focused; business logic belongs in the state layer (`PROJECT.md` → Paths → Frontend state/store)
- Use the project's existing HTTP client and auth header patterns
- New routes follow the project's existing lazy-loading and auth-guard conventions
- No new production dependencies without justification
- Consult the domain documentation for response shapes the UI displays
- After coding, run the **regression scan**: alternate entry paths, state-source mismatches, sibling views with the same defect
- **Browser verification**: follow `.github/ai/FE_PLAYWRIGHT.md`, and tear down any server you started

Output:
- Code diff in the frontend repository
- `## Step 2F Summary — Frontend Implementation` appended to the brief (changed files, components modified, regression scan, browser verification result)

## 3F) Frontend Unit Tests

Goal: quality gate — verify rendering, user interactions, and API contract shapes.

Rules:
- Tests live beside the source file following the project's existing test layout
- Prefer isolated component mounts for unit behavior and full mounts for parent-child integration
- Mock HTTP responses with real field names and real domain codes from the domain documentation
- Prefer stable test-id selectors over text or CSS structure
- Snapshot-only tests do not count as behavior coverage
- All tests must pass before proceeding, using the configured **Frontend tests** command

Output:
- Added test files
- Final counts (passed / failed / skipped)

## 6F) Frontend Review

Goal: risk-focused review of the frontend changes.

Checklist:
- Scope creep (only files in the brief's scope modified)
- Security (injection into rendered output, insecure data handling, credential exposure)
- Framework best practices (no direct DOM manipulation, no mutating inputs, correct two-way binding)
- Test coverage (every changed component has behavior tests)
- API integration correctness (endpoints, headers, error and empty states)
- Accessibility basics (labels, roles, keyboard reachability)
- **Regression scan audit**: independently re-scan sibling views and alternate entry paths
- **Browser verification**: follow `.github/ai/FE_PLAYWRIGHT.md` — a failed AC is a BLOCKER, an auth-blocked skip is a WARNING

Output:
- Findings ordered by severity (BLOCKER / WARNING / NOTE)
- Step 6F status: `✅ Complete` or `⛔ Blocked — Rework Required`

Loop-back:
- The reviewer sets `**Rework target:** tests|code|mixed` and restages 3F (tests) or 2F plus 3F (code or mixed). The extension opens `/frontend-unit-test` or `/frontend-implementation` once per loop, then the frontend pipeline continues

## 7F) Frontend Handoff

Goal: produce a continuation file summarizing all frontend changes.

Output:
- `HANDOFF.md` at the workspace root with frontend-specific sections:
  - Components changed or created
  - Routes added or modified
  - State/store changes
  - Test results
  - Build verification using the configured **Frontend build** command

---

## Rework Routing

| Blocked Step | Rework target | Routes To | Then continues |
|---|---|---|---|
| 6 (backend review) | `tests` | `/unit-test` | 3 → 4 → 5 → 6 |
| 6 (backend review) | `code` or `mixed` | `/backend-implementation` | 2 → 3 → 4 → 5 → 6 |
| 5 (API execution code fix) | — | `/backend-implementation` | 2 → 3 → 4 → 5 |
| 3 (unit tests found a product bug) | — | `/backend-implementation` | 2 → 3 |
| 6F (frontend review) | `tests` | `/frontend-unit-test` | 3F → 6F |
| 6F (frontend review) | `code` or `mixed` | `/frontend-implementation` | 2F → 3F → 6F |
| 3F (frontend tests) | — | `/frontend-implementation` | 2F → 3F |

Rework loop cap: 5 total, shared across backend and frontend. Each loop opens the target agent once. At the cap, routing stops and a human investigates.

## Definition of Done

A ticket is done when all applicable items are true.

**Backend (Steps 2-7):**
- Acceptance criteria are checked off
- Unit tests present and passing using the configured **Unit tests** command
- Contract suite updated and executed successfully, or the stage is documented as disabled
- Review has no unresolved BLOCKER findings
- `HANDOFF.md` written for continuity

**Frontend (Steps 2F-7F):**
- Acceptance criteria are checked off
- Frontend tests present and passing using the configured **Frontend tests** command
- Review has no unresolved BLOCKER findings
- Build succeeds using the configured **Frontend build** command; **Frontend lint** passes when configured
- `HANDOFF.md` written for continuity

## QA Pipeline Workflow

After the dev workflow completes, a separate QA pipeline generates regression tests and smoke checks against the **deployed** environment. See `.github/ai/QA_WORKFLOW.md` for the QA step definitions and `.github/ai/QA_AGENT_CATALOG.md` for QA agent roles.

QA agents: `/qa-intake`, `/qa-test-generator`, `/qa-smoke-builder`, `/qa-report`
QA orchestrator: `/qa-workflow` (runs all QA steps in one session)

The `/workflow` and `/qa-workflow` one-chat orchestrators write the same progress cells the
extension watches. Disable the extension for the workspace while using either orchestrator;
otherwise use the normal per-step pipeline to avoid duplicate chats.
