# QA Pipeline Workflow

This workflow generates and maintains regression tests and smoke checks for deployed environments. It runs **after** the dev workflow (Steps 1-7) completes — the code is already implemented and reviewed. QA agents target the deployed API, not the source code.

Read `.github/ai/PROJECT.md` first. It is the authoritative source for repositories, commands, paths, test environments, fixture roles, and whether Post-deploy QA is enabled. If any required field still contains an angle-bracket placeholder (`<...>`), or an optional stage still reads `enabled | disabled`, stop and name the unresolved setting — never guess it. QA runs against the **Test** environment; implementation steps run against **Local**. Never mix them in one step, and never point either at production. Never commit, push, deploy, migrate data, change pipelines, write to production, run bulk jobs, or publish externally without explicit human approval.

## When to Run

Trigger the QA workflow when:
- A dev workflow handoff includes new or changed endpoints
- Regression test coverage needs expanding for an existing endpoint
- Smoke test checks need updating (new routes, changed health checks)
- A production incident reveals a gap in post-deploy verification

If Post-deploy QA is `disabled` in `PROJECT.md`, mark the QA rows `⏭️ Skipped`, append a summary explaining why, and stop.

## QA Step 1 — QA Intake

Goal: scope the testing effort and identify what needs coverage.

Inputs:
- `HANDOFF.md` from the dev workflow (if available)
- `.github/ai/active-brief.md` (if the dev ticket is still active)
- Current regression test coverage (`PROJECT.md` → Paths → Regression test project/suite)
- Current smoke script (`scripts/smoke-test.sh` or the project equivalent)

Output:
- QA brief using `.github/ai/templates/QA_BRIEF_TEMPLATE.md`:
  - Endpoints requiring new regression tests
  - Risk classification per endpoint (high / medium / low)
  - Smoke test candidates (new routes that should be checked post-deploy)
  - Test data requirements (record IDs, expected states) drawn from the fixture catalog
  - Coverage gaps in existing regression tests
- `## QA Step 1 Summary`

Gate:
- Unresolved environment, fixture, or scope questions stop the pipeline. Otherwise QA-1 routes
  to QA-2 automatically. A team requiring a manual QA-plan checkpoint must pause or disable
  routing before QA-1 completes; the extension has no intermediate approval state.

## QA Step 2 — Test Generator

Goal: create or update regression tests and ensure they pass against the target environment.

Rules:
- Tests live in the configured regression suite, organized by entity
- Tests use the suite's shared base class for HTTP client setup. The deploy pipeline injects only the base URL and the standard caller credentials recorded in `PROJECT.md` → Test environments / Fixture roles. Tests needing any other credential (bearer/token secrets, specialized identity keys) must **skip** on deploy — never fail — and must never construct those clients in a class constructor, or a missing variable fails every test in the class.
- Identity/auth/publisher ACs use in-memory caller shapes from the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns), labeled with the pattern id. Privileged-fixture-caller HTTP does not cover those ACs. Do not invent a fixture-role variable that is not in the documented map.
- Record IDs come from the fixture catalog constants — do not hardcode IDs elsewhere
- For read tests: assert status code + key response fields. For partial-update tests: capture state before and restore it after, so shared test data is not polluted
- Use the client that matches the route family (`PROJECT.md` → Architecture → Route families)
- All tests must pass against the target environment before marking the step complete

Output:
- New or updated test files in the regression suite
- Updated fixture catalog constants if new test record IDs are needed
- Test results (passed / failed / skipped)
- `## QA Step 2 Summary`

## QA Step 3 — Smoke Builder

Goal: update the smoke test script to cover new routes or changed endpoints.

Rules:
- The smoke script lives at the path recorded in `PROJECT.md` (for example `scripts/smoke-test.sh`)
- Use the check helper that matches the route family: authenticated, external-caller, or unauthenticated health/status
- Smoke tests verify **liveness and routing** — status code assertions only, no response body parsing
- Smoke stays on the standard caller. Do not add identity-pattern coverage to smoke (15s budget).
- Total smoke execution time must stay under 15 seconds (excluding the warmup wait)
- New endpoints use record IDs from the fixture catalog constants

Output:
- Updated smoke script
- Verification that the script runs successfully
- `## QA Step 3 Summary`

## QA Step 4 — QA Report

Goal: summarize testing coverage and pipeline readiness.

Output:
- QA report using `.github/ai/templates/QA_REPORT_TEMPLATE.md`:
  - Tests added/modified (file list with test counts)
  - Smoke checks added/modified
  - Coverage summary (which endpoints have regression tests, which have smoke checks)
  - Pipeline artifact impact (any configuration changes needed for new test assemblies) — flagged for humans, never applied by an agent
  - Open items (endpoints without coverage and why)
- Updated `active-qa-brief.md` with completion status
- `## QA Step 4 Summary`

## Status last (hard gate)

Write the step summary to disk **first**, then flip the QA progress row status cell to `✅ Complete` as the last edit. Blocked runs use `⛔ Blocked — Rework Required` or `⛔ Blocked — Code Fix Required`; disabled or environment-skipped stages use `⏭️ Skipped`.

## Definition of Done

- Every endpoint from the dev handoff has at least one regression test
- Smoke script covers all critical routes (health check + at least one authenticated route per route family)
- All regression tests pass against the target environment, or their skips are documented with the missing setting
- QA report documents coverage and any deferred items
