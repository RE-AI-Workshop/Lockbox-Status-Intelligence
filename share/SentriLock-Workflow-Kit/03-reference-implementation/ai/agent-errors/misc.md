# Agent Error Log — Misc (Environment and Workflow)

## What this file is for

Shared environment, tooling, and process pitfalls that are not specific to one step: shell and PATH traps, brief and status-table handling, scope discipline, and environment targeting. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** every agent, alongside its own file, before starting work.

**Who writes to it:** Intake, Handoff, QA Intake, QA Smoke, QA Report, and Release Notes, which have no file of their own. Other agents write here only when the lesson is environmental or about workflow routing. Do not create a new file for a role with a single lesson — put it here.

**What does not belong here:** role-specific engineering lessons go to `backend-implementation.md`, `unit-test.md`, `api-suite.md`, `api-execution.md`, or `frontend.md`. `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom; never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets or machine paths. Environment lessons must be reproducible on another machine or must say which host setup they depend on; workflow lessons name the contract they protect — the status value, summary heading, table row, or file path.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — exact error text, or the wrong workflow behavior observed
**Why it happened**: the cause, classified as environment, tooling, or process
**Resolution**: what fixed it, the ordering rule or gate that prevents a repeat, and the evidence — the command that now succeeds, or the brief state proving the workflow advanced
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### Sourcing a local environment file clobbers the shell PATH

**Obstacle**: after sourcing the project's local environment file, ordinary commands failed with command-not-found and scripts that had worked minutes earlier broke.
**Why it happened**: that file exports a narrowed PATH intended for a different context, and sourcing it replaces the interactive shell's PATH.
**Resolution**: restore a working PATH after sourcing, or export only the variables the step needs instead of sourcing the whole file. Never rely on the PATH stored in an environment file for an agent shell, and confirm the step's tools still resolve before continuing.

### Flipping the status cell before the summary exists

**Obstacle**: a status cell was marked `✅ Complete` before its summary was written to disk, and the next step started against a missing summary.
**Why it happened**: the status edit is the smallest edit, so it was made first while the summary was still being drafted.
**Resolution**: write the step summary to disk **first**, then flip the status cell as the very last edit. Keep the summary headings and status values byte-identical to the workflow contract — the routing extension will not advance without them.

### Splitting a reviewer's blocked verdict across several edits

**Obstacle**: a reviewer wrote the blocked status in one edit and incremented the rework counter in a later one, and the routing extension opened the same follow-up command twice.
**Why it happened**: the extension reacts to each write of the brief, so a partially written verdict looks like a second rework loop.
**Resolution**: write the verdict, the rework target, the blocked status, the loop increment, and any restaged rows in a **single** edit to the brief. Route by the rework target — tests to the test step, code or mixed to the implementation step — and let the pipeline continue forward rather than jumping straight back to review.

### Writing lessons to the retired combined log

**Obstacle**: after the log was split into one file per role, agents kept opening the old single-file path and recreated it as a combined log, so lessons landed where no prompt reads them.
**Why it happened**: habit from the previous process, even though the prompts already named the folder files.
**Resolution**: the old sibling path next to this folder is a retired pointer — do not read it as a log, append to it, or recreate it. Open the file for your step and keep the filenames as they are: prompts require-read these exact paths.

### Treating a transport failure as license to widen scope

**Obstacle**: after a deployed run showed connection resets plus one unrelated 500, an agent began editing shared validation logic and a global HTTP client — far more files than the ticket allowed.
**Why it happened**: the failures landed in the same window as the change under test, so they were assumed to share a cause.
**Resolution**: harden the harness instead — retry transport errors and throttling responses, and never retry a 500 that returns a real body. Keep the changed-file set inside the brief's scope, and file a genuine product error against its own ticket with the evidence rather than absorbing it into this one.

### Mixing local and deployed work in one step

**Obstacle**: implementation-step requests ran against the deployed environment because a base-URL variable carried over, and an AC only the deployed environment can prove was reported as locally verified.
**Why it happened**: both base URLs live in the same environment file and nothing in the step asserted which one was in play.
**Resolution**: implementation steps run against Local and post-deploy QA against Test, using the base-URL variables in `PROJECT.md` → Test environments. Never mix them in one step, never point either at production, and name deferred ACs in the step summary so the QA workflow picks them up.

### Improvising a substitute for a disabled stage

**Obstacle**: an optional stage was disabled for the project, and the agent invented a test stack for it rather than skipping it, leaving the progress row unresolved and the workflow stalled.
**Why it happened**: the prompt described the stage as if it always runs, and no row may be left blank.
**Resolution**: when `PROJECT.md` → Optional stages disables a stage, append the step summary explaining why and mark the progress row `⏭️ Skipped`. If a required setting is still a `<placeholder>`, stop and name the missing setting instead of guessing it.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
