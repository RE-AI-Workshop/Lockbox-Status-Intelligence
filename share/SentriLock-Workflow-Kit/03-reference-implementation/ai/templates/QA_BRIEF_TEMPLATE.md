# QA Brief

- Ticket ID: 
- Dev Handoff: <!-- link to HANDOFF.md or dev ticket -->
- Target Environment: <!-- Test environment name from PROJECT.md → Test environments. QA runs post-deploy against Test — never Local, never production. -->
- External test plan id: <!-- only when PROJECT.md → Optional stages enables external test management -->

## Source Changes Summary

<!-- From HANDOFF.md — what endpoints changed and how -->

| Endpoint | Method | Change Type | Breaking |
|----------|--------|-------------|----------|
|          |        |             |          |

## Risk Classification

| Endpoint | Risk | Rationale |
|----------|------|-----------|
|          |      |           |

Risk levels:
- **High**: New endpoint, mutating operation, auth change
- **Medium**: Changed response shape, new query parameter
- **Low**: Internal refactor with no API surface change

## Acceptance Criteria Coverage

<!-- Extract every AC from the ticket/handoff. For each AC, list the regression test(s) that prove it. -->

| AC # | Acceptance Criterion | Test Name(s) | Edge Cases |
|------|---------------------|--------------|------------|
|      |                     |              |            |

Edge case categories to consider per AC:
- **Boundary values**: empty strings, nulls, zero-length collections, max-length fields
- **Invalid input**: wrong types, missing required fields, malformed ids
- **Auth/role**: unauthorized caller, wrong role, missing headers — and, when identity-sensitive, the applicable caller/identity shapes listed in the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns)
- **State-dependent**: entity in an unexpected state (inactive record, closed parent, etc.)
- **Concurrency/idempotency**: duplicate requests, already-applied updates

## Test Data Requirements

| Test | Entity ID | Expected State | Source |
|------|-----------|----------------|--------|
|      |           |                | fixture constants file (`PROJECT.md` → Paths) |

## Identity Pattern Coverage

When the change is identity-, auth-, or sender-sensitive, list the applicable caller/identity shapes from the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns). Privileged-fixture-caller-only is not coverage. Regression tests use in-memory caller fixtures labeled with the pattern id. Token-mint and specialized-caller HTTP is Local-only: gate it on its exact fixture-role key so it skips on deploy — never a required deploy failure, never a constructor-level client. Smoke stays privileged-caller liveness — do not expand smoke to every caller shape. Do not invent a fixture-role key that is not in the catalog.

| Pattern id | Applies? | Test Name(s) | Notes |
|------------|----------|--------------|-------|
|            |          |              |       |

## Existing Coverage

| Endpoint | Regression Test | Smoke Check | Gap |
|----------|----------------|-------------|-----|
|          |                |             |     |

## Test Plan

### Regression Tests to Add/Update

| Test File | Test Name | Endpoint | Assertion |
|-----------|-----------|----------|-----------|
|           |           |          |           |

### Smoke Checks to Add/Update

<!-- Availability plus the ticket's critical path. Status codes only — no body parsing. -->

| Route | Check Type | Expected Status |
|-------|------------|-----------------|
|       |            |                 |

## QA Workflow Progress

| Step | Status | Notes |
|------|--------|-------|
| QA-1 — Intake | | |
| QA-2 — Test Generator | | |
| QA-3 — Smoke Builder | | |
| QA-4 — Report | | |

<!-- Each step writes its `## QA Step N Summary` to disk before flipping its row to `✅ Complete`.
     If PROJECT.md disables post-deploy QA, mark the rows `⏭️ Skipped` and record why in the summary. -->
