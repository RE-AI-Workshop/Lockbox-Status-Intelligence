# QA Agent Catalog

QA agents generate and maintain regression tests and smoke checks. They run after the dev workflow completes, against the deployed **Test** environment defined in `PROJECT.md` → Test environments. Read `PROJECT.md` before acting; if Post-deploy QA is `disabled`, mark the QA rows `⏭️ Skipped` and explain why instead of inventing a test stack.

## QA-1) QA Intake Agent

Mission:
- Scope the testing effort based on the dev workflow handoff.

Inputs:
- `HANDOFF.md` (endpoint changes, API surface impacts)
- Current regression test coverage (`PROJECT.md` → Paths → Regression test project/suite)
- Current smoke script

Outputs:
- QA brief with risk classification per endpoint
- Test data requirements
- Coverage gap analysis
- `## QA Step 1 Summary`

Quality bar:
- Every changed endpoint has a risk classification
- Test data IDs reference the shared fixture catalog constants, never ad-hoc literals
- Identity-sensitive handoffs list the applicable caller shapes; privileged-fixture-caller-only evidence does not cover those ACs; smoke stays liveness

## QA-2) Test Generator Agent

Mission:
- Create or update regression tests targeting the deployed API, using the configured Regression tests command.

Inputs:
- QA brief (endpoints, risk levels, test data)
- Existing test patterns in the configured regression suite
- The suite's shared base class or setup helper (HTTP clients, auth)

Outputs:
- New/updated test files organized by entity
- Updated fixture catalog constants if new IDs are needed
- All tests passing
- `## QA Step 2 Summary`

Quality bar:
- Read tests assert status code + key response fields
- Partial-update tests use the capture-and-restore pattern
- No hardcoded record IDs outside the fixture catalog
- Tests use the client that matches the route family (`PROJECT.md` → Architecture → Route families)
- Identity ACs use in-memory caller-shape fixtures labeled with the pattern id from the identity patterns doc, not extra records
- Tests requiring credentials the deploy pipeline does not inject must **skip**, never fail, and must not build those clients in a class constructor

## QA-3) Smoke Builder Agent

Mission:
- Update the smoke test script for new or changed routes.

Inputs:
- QA brief (new routes, changed endpoints)
- Current smoke script
- Fixture catalog for record IDs

Outputs:
- Updated smoke script
- Verified against the target environment
- `## QA Step 3 Summary`

Quality bar:
- Status code assertions only (no body parsing)
- Total smoke time under 15 seconds (excluding warmup)
- Uses the correct check function per route type (authenticated, external, unauthenticated health)
- Does not add identity-pattern coverage to smoke

## QA-4) QA Report Agent

Mission:
- Summarize testing coverage and pipeline readiness.

Inputs:
- Test results from QA Step 2
- Smoke script changes from QA Step 3
- QA brief for coverage gap tracking

Outputs:
- QA report with coverage summary
- Updated `active-qa-brief.md`
- `## QA Step 4 Summary`

Quality bar:
- Every endpoint has documented coverage status
- Open items have explicit rationale
- Skips are named with the missing setting or credential, never presented as passes

## Recommended Orchestration Pattern

Preferred sequence:
1. QA Intake Agent
2. Test Generator Agent
3. Smoke Builder Agent
4. QA Report Agent

Escalation rule:
- If test data is unavailable in the target environment, surface to the human before QA Step 2.
- If smoke script changes require pipeline configuration updates, note it in the QA Report for human action — agents do not change pipelines.
