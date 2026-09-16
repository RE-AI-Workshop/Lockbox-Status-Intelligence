# Agent Error Log — Backend Implementation (Step 2)

## What this file is for

Reusable production-code and build pitfalls hit while implementing backend work, so the next implementation agent does not rediscover a trap that already cost a rework loop. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** the Backend Implementation agent (`/backend-implementation`) before writing any production code, together with `misc.md`. The Reviewer (`/reviewer`) reads it while reviewing, and the Handoff agent reads the files for the steps that ran.

**Who writes to it:** the Backend Implementation agent owns this file. The Reviewer may append here when the mistake was made in Step 2 — an entry belongs to the file of the agent that made it, not the agent that found it.

**What does not belong here:** environment, IDE, and workflow-routing lessons go to `misc.md`; test authoring and test runs to `unit-test.md`; collections and fixtures to `api-suite.md`; UI to `frontend.md`. `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom and never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets or machine paths, and reference code by layer and symbol rather than line number.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — exact error text, status code, or wrong value
**Why it happened**: the cause, including the wrong assumption behind it
**Resolution**: the fix, the gate that would have caught it earlier, and the evidence that proves it
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### Fixing one verb's handler while the sibling verb keeps the old behavior

**Obstacle**: a fix landed on one write verb; the sibling verb sharing that behavior kept the old logic and shipped broken.
**Why it happened**: the ticket named one endpoint and the rework note listed one failing case, so the search stopped there — alternate verbs, alternate route families, and other callers of the changed method were never checked.
**Resolution**: run the regression scan before completing the step and record it in the Step 2 Summary. In-scope siblings are fixed in this step, never deferred to a follow-up ticket; a partial fix is rework, not progress.

### Expanding an allowlist only as far as the reviewer named

**Obstacle**: a sensitive-endpoint blocklist was incomplete across three rework loops; each pass added exactly the paths the reviewer had listed.
**Why it happened**: the brief's advisory notes were treated as a complete inventory and no exhaustive search was run.
**Resolution**: build allowlists and blocklists from a search — find every model carrying credential-like or restricted fields, map each to the operations that accept it, add all discovered paths in one change, and add one test per entry in that same change. Never defer those tests to a step that is already complete.

### A successful build does not prove the route table

**Obstacle**: a second route family was added with a relative template on a handler that already had a class-level prefix. The intended path returned 404 while the framework served it nested under the old prefix.
**Why it happened**: compilation never validates the resulting route table, and the accompanying test asserted a substring instead of the full path.
**Resolution**: use absolute templates for a second route family, make a live probe of every AC path the exit gate for this step (404 is a failure, never a warning), and assert full registered paths rather than substrings.

### Reading the prior state after the save returns the new state

**Obstacle**: a transition case — active to inactive, ownership move, primary reassignment — reported the new value because prior state was read from the same record after persisting.
**Why it happened**: patch-style paths often still hold the pre-change value, so the replace-style path was assumed to as well. It does not.
**Resolution**: capture prior state into a local **before** applying the change, using an untracked read where the data layer supports one, and put derived transition data on its own envelope field rather than inside a serialized payload string.

### Loading a whole entity graph to answer an existence question

**Obstacle**: a validation guard loaded a full related entity with change tracking, and those tracked rows collided with a later write in the same unit of work, failing an unrelated update.
**Why it happened**: an existing read method was reused for convenience, without considering what it attaches to the context.
**Resolution**: answer existence with an existence-only query, apply the change at **every** call site of that guard rather than only the one that failed, and keep guards ahead of the transaction boundary so unit tests can reach them.

### Silently fixing — or silently dropping — a defect found in passing

**Obstacle**: an agent noticed a genuine defect outside the ticket (a query reading the wrong source, a report excluding the wrong population) and either folded it into this diff or said nothing. In a related case, an internal-only serialization flag was cleared on a published payload to correct an external caller's response, and the downstream consumer lost fields.
**Why it happened**: the finding felt too small to raise, and two concerns — what the caller may see versus what the consumer needs — were solved in one place.
**Resolution**: record the finding here with layer, impact, and a pointer to the correct sibling implementation for comparison, and raise it in the step summary so a human can assign a ticket. Strip caller-visible fields at the transport boundary, never inside a shared publish path, and never widen the changed-file set beyond the brief's scope without explicit approval.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
