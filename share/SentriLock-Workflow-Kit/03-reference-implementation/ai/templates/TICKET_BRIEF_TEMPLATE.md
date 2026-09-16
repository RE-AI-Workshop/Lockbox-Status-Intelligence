# Ticket Brief Template

## Context
- Ticket ID:
- Title:
- Link:
- Priority:

## Track Classification

| Signal | Value |
|--------|-------|
| Backend signals | |
| Frontend signals | |
| AC analysis | |
| **Track** | **[Backend / Frontend / Full-Stack]** |

Steps for this ticket:
- Backend: 2 → 3 → 4 → 5 → 6 → 7
- Frontend: 2F → 3F → 6F → 7F
- (Delete whichever track does not apply)

## Problem Statement

Describe the issue or feature in plain terms.

## Acceptance Criteria

Use behavior-focused, testable outcomes only. Do not encode code location, method names, literals, or predicate details unless the ticket explicitly requires them.

- [ ] AC1:
- [ ] AC2:
- [ ] AC3:

## Scope

In scope:
- 

Out of scope:
- 

## Affected Repositories

List every repository this ticket will change, using the roles defined in `.github/ai/PROJECT.md` → Repositories. A change to shared messaging, permissions, or recipient rules usually touches the primary repository **and** the additional service. Every repository listed here must be implemented in the same Step 2 pass.

- 
- 

## Implementation Notes (Non-Binding)

Advisory technical clues for Step 2 only. These notes are not implementation directives.

- Candidate files/methods:
- Candidate constants/literals:
- Known pitfalls/assumptions:
- Identity/caller shapes (from `PROJECT.md` → Paths → Identity/caller patterns): applicable shape ids, or N/A
- Contract-suite caller keys (exact variable names from `PROJECT.md` → Fixture roles; never invent a key): or N/A
- Reason notes are advisory only:

## Sister Method Analysis

Methods or components with structurally similar patterns found during research.

### [Method or component name]
- **Caller chain:** [who calls it → what they do with the result]
- **Same business rule applies?** [Yes/No — why]
- **Concrete failure scenario:** [specific input → actual output → expected output]
- **Fix identical?** [Yes/No]
- **Decision:** [Included in scope / Excluded — reason]

## Affected API Surface

- Route family: (see `PROJECT.md` → Architecture → Route families)
- Endpoints:
- Breaking change risk: Yes/No

## Solution Options Analysis

Evaluate all realistic implementation locations before coding. Include at least 3 options when possible (for example: transport layer, orchestration/service layer, data-access layer, query predicate, middleware). For frontend tickets, score the equivalent frontend locations (component logic, state action, computed value, route guard) instead of backend layers.

| Option | Where | Pros | Cons | AC Coverage Confidence (1-5) | Implementation Safety (1-5) | Testability (1-5) | Architecture Fit (1-5) | Future Capability Enablement (1-5) | Total (/25) |
|--------|-------|------|------|------------------------------|------------------------------|-------------------|------------------------|-------------------------------------|-------------|
| A | | | | | | | | | |
| B | | | | | | | | | |
| C | | | | | | | | | |

### Selected Approach

- Chosen option:
- Why this is best for this ticket:
- Why alternatives were not chosen:
- Determinism rule for re-runs (what future runs should choose and why):

## Implementation Plan

1. 
2. 
3. 

## Test Plan

Name the applicable identity/caller shapes here and put each assertion on the layer that can prove it. Login and publisher-identity resolution belong in unit tests. External-caller shapes and login endpoints belong in the contract suite with exact fixture-role variable keys from `PROJECT.md`.

Unit tests:
- 

Integration tests:
- 

API/contract suite tests:
- Collection(s):
- Variables needed: (exact fixture-role keys, never invented names)
- Cleanup steps:

## Risks and Mitigations

- Risk:
- Mitigation:

## Evidence of Completion

- Build status:
- Test status:
- Rework loops: 0
- Suite status:
- Handoff written:

## Workflow Progress

Update this table as each step completes. The next agent reads this to understand where the work stands. Write the step's summary section first, then set its Status cell — the extension advances only when both are present.

| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | | |
| 2 — Backend Implementation | | |
| 3 — Unit Tests | | |
| 4 — API Suite Generation | | |
| 5 — API Suite Execution | | |
| 6 — Backend Review | | |
| 7 — Backend Handoff | | |
| 2F — Frontend Implementation | | |
| 3F — Frontend Unit Tests | | |
| 6F — Frontend Review | | |
| 7F — Frontend Handoff | | |

Status values: `✅ Complete`, `⛔ Blocked — Rework Required`, `⛔ Blocked — Code Fix Required`, `⛔ Blocked — Loop Cap Reached`, `⏭️ Skipped` (for stages disabled in `PROJECT.md`).

<!-- Delete rows for steps that don't apply to this ticket's track -->

---

<!-- Step summaries are appended below by agents during execution. -->
