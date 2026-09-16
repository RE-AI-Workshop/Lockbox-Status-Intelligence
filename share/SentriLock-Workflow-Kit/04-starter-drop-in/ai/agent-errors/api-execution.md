# Agent Error Log — API Suite Execution (Step 5)

## What this file is for

Reusable pitfalls in starting the local application and running the contract suite: local configuration gaps, process control, runner stability, fixture teardown, and environment targeting. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** the API Execution agent (`/api-execution`) before starting the local app or running the suite, together with `api-suite.md` and `misc.md`. The Reviewer and Handoff agents read it when judging whether a run counts as evidence.

**Who writes to it:** the API Execution agent owns this file. Collection, fixture-design, and assertion causes go to `api-suite.md` even when the failure first appeared during a run — an entry belongs to the file of the agent that made the mistake.

**What does not belong here:** collection authoring and fixture discovery go to `api-suite.md`; production-code causes to `backend-implementation.md`; test authoring to `unit-test.md`; UI to `frontend.md`. If the API suite stage is `disabled` in `PROJECT.md` → Optional stages, this file stays empty. `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom; never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets, connection strings, or machine paths, and reference commands by their `PROJECT.md` → Commands key rather than pasting a host-specific invocation.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — status codes, exit code, or runner output
**Why it happened**: the cause, classified as environment, harness, or product defect
**Resolution**: what fixed it, the probe or ordering rule that would have caught it earlier, and the evidence — requests executed, assertions passed, two consecutive clean runs
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### Treating an authentication success as proof the app can serve requests

**Obstacle**: the local app started and credential checks passed, but every data-backed endpoint returned 500 because a connection setting in the ignored local configuration file was empty, so the data-access dependency could not be constructed.
**Why it happened**: the committed configuration ships that value blank and the ignored local file was absent, while the auth path never touches the data layer.
**Resolution**: confirm the local configuration named by `PROJECT.md` → Commands → Start local app is present, or export the missing setting before starting; then run the configured local health check **and** probe one real data-backed endpoint. Blanket 500s traced to missing local configuration are environment, never `⛔ Blocked — Code Fix Required`.

### Rebuilding while the previous step's process still holds the output

**Obstacle**: the build failed while copying its own output artifact because an instance left running by the previous step still held the file lock, and it was nearly reported as a compilation failure.
**Why it happened**: the step order said build first, but the running process from the earlier step was never stopped.
**Resolution**: stop any instance started by an earlier step before running the configured Build command, then start a fresh one. A lock failure names the locked artifact rather than a source file — classify it as harness and retry after stopping the process.

### Runner and app crashes on very large responses

**Obstacle**: the suite runner was killed mid-request on a very large response payload, which also destabilized the app process, so the immediate rerun could not connect at all.
**Why it happened**: the runner's default memory ceiling is below what a multi-megabyte response needs, and the crash took a fragile host process with it.
**Resolution**: raise the runner's memory limit through its documented environment variable, health-check the heavy endpoint between consecutive runs, and restart the app when it is unhealthy. Do not weaken the assertion that produced the large response to make the run finish.

### Pointing a step at the wrong environment

**Obstacle**: requests meant for the local environment ran against the deployed one because the base-URL variable carried over between steps, and an AC only the deployed environment can prove was reported as locally verified.
**Why it happened**: both base URLs live in the same environment file and nothing in the run asserted which one was in play.
**Resolution**: take the base URL from the variable named in `PROJECT.md` → Test environments for the current step — implementation steps use Local, post-deploy QA uses Test — never mix them in one step, and never point either at production. Defer environment-specific ACs explicitly in the step summary so the QA workflow picks them up.

### Leaving the fixture dirty when a run stops early

**Obstacle**: a failing assertion ended the collection before teardown, and the next run's create-path ACs failed against the leftover rows.
**Why it happened**: cleanup lived at the end of the happy path, so any early exit skipped it.
**Resolution**: treat teardown as part of the run — verify the fixture is back to its expected state before reporting the step complete, restore through the same domain operation that created the state, and record leftovers you could not clear so the next preflight can park them.

### Citing numbers from a run that did not finish

**Obstacle**: a step quoted pass counts from an earlier session after the current run aborted or was killed, so review and handoff proceeded on numbers nobody had reproduced.
**Why it happened**: the abort read as noise and a previous count was already written in the brief.
**Resolution**: retry once, then report what actually happened — requests executed, assertions passed and failed, and whether two consecutive clean runs were achieved. If the retry also failed, say so and classify it. A stale count is worse than an honest blocker.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
