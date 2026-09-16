# Agent Error Log

Entries here are written by workflow agents to prevent repeating the same mistakes across tickets.
Read **your** file (and `misc.md`) before starting work. Append an entry when you hit a non-obvious pitfall.

**Location rule:** These files are committed to the repository so all developers and agents can access them. Do NOT write agent errors into an agent memory store — write them here.

**Retired path:** `.github/ai/agent-errors.md` (a sibling file next to this folder) is a pointer only. Do **not** read it as a log, do **not** append entries there, and do **not** recreate it as a combined log. If you opened that path by habit, stop and open **your** file in this folder instead.

**Frontend vs backend:** These are different codebases and different pitfalls. Backend agents read and write the backend files only. Frontend agents read and write `frontend.md` only. Do not put UI/component-test lessons into a backend file, and do not put data-access or suite-runner lessons into `frontend.md`.

## Which file to read and write

| Agent | Track | Read | Write new entries to |
|---|---|---|---|
| Backend Implementation (Step 2) | Backend | `backend-implementation.md`, `misc.md` | `backend-implementation.md` |
| Unit Test (Step 3) | Backend | `unit-test.md`, `misc.md` | `unit-test.md` |
| API Suite (Step 4) | Backend | `api-suite.md`, `misc.md` | `api-suite.md` |
| API Execution (Step 5) | Backend | `api-execution.md`, `misc.md` | `api-execution.md` |
| Reviewer (Step 6) | Backend | `backend-implementation.md`, `unit-test.md`, `misc.md` | the file for the agent that made the mistake |
| Handoff (Step 7) | Backend | files for steps that ran + `misc.md` | the file for the step that hit the pitfall |
| Frontend Implementation (2F) | Frontend | `frontend.md`, `misc.md` | `frontend.md` |
| Frontend Unit Test (3F) | Frontend | `frontend.md`, `misc.md` | `frontend.md` |
| Frontend Reviewer (6F) | Frontend | `frontend.md`, `misc.md` | `frontend.md` (or `misc.md` for workflow-only) |
| Frontend Handoff (7F) | Frontend | `frontend.md`, `misc.md` | `frontend.md` |
| QA Test Generator / QA Workflow | QA | `unit-test.md` (test-host and runner aborts), `misc.md` | `misc.md` unless the lesson is a backend test-run pitfall |
| Intake, QA Intake, QA Smoke, QA Report | — | `misc.md` if needed | `misc.md` |

There is **no** dedicated file for intake, handoff, QA smoke/report, or frontend handoff. One-off lessons from those roles go in `misc.md`.

Filenames are part of the contract: prompts require-read these exact paths. Do not rename `backend-implementation.md` to `implementation.md`, and do **not** create a new file for an agent that only has a single lesson — use `misc.md`.

## Entry format

Each entry needs a short title, the symptom, the cause, the fix, and the ticket/date it was seen. Only add entries that would be reusable across tickets.

```
## YYYY-MM-DD — Short title (TICKET)

**Obstacle**: …
**Why it happened**: …
**Resolution**: …
```
