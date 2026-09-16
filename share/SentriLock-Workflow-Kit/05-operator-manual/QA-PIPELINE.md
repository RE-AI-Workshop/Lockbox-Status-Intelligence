# Operator manual — QA pipeline

Run **after** a useful `HANDOFF.md` (or a ticket that already shipped).

Start: **Project Workflow: Start QA Ticket**.

| Step | Slash | Job |
|------|-------|-----|
| QA-1 | `/qa-intake` | Scope, risk, map ACs to tests, write `active-qa-brief.md` |
| QA-2 | `/qa-test-generator` | Regression tests against the configured deployed test environment |
| QA-3 | `/qa-smoke-builder` | Small, safe critical-path smoke checks |
| QA-4 | `/qa-report` | Coverage, evidence, defects, and release recommendation |

Human gate after QA-1. If data is missing in the configured environment, stop — do not substitute another environment.

Smoke is not a second regression suite. Do not parse bodies. Do not add every identity shape.
