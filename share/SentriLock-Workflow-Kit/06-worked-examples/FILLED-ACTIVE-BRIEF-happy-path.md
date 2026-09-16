# Ticket Brief — Example

## Context
- Ticket ID: DEMO-123
- Title: Return a clear validation error for unsupported status

## Track Classification
- **Track:** Backend

## Acceptance Criteria
- [x] When a caller submits an unsupported status, the API returns 400 with a stable validation code.
- [x] The record remains unchanged.

## Scope
**In:** request validation, unit coverage.
**Out:** new statuses, UI changes.

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | Guard added before persistence |
| 3 — Unit Tests | ✅ Complete | 4 passed |
| 4 — API Suite Generation | ⏭️ Skipped | Disabled for example project |
| 5 — API Suite Execution | ⏭️ Skipped | Stage disabled |
| 6 — Backend Review | ✅ Complete | Approved |
| 7 — Backend Handoff | ✅ Complete | HANDOFF.md written |

## Step 2 Summary — Implementation
- Changed validation service only.
- Build: passed with configured command.
- Contract: unsupported status now returns 400; valid behavior unchanged.

## Step 3 Summary — Unit Tests
- Added valid, invalid, null, and persistence-unchanged cases.
- Result: 4 passed, 0 failed.

## Step 6 Summary — Review
- **Verdict**: Approved
