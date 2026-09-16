# Agent Error Log — API Suite (Step 4)

## What this file is for

Reusable pitfalls in discovering fixtures and generating a contract collection: fixture state and lifecycle, caller and identity coverage, variable scopes, and runner semantics that differ from the editor. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** the API Suite agent (`/api-suite`) before discovering fixtures or writing a collection, together with `misc.md`. The API Execution agent reads it before running the suite, and the Reviewer reads it while auditing contract coverage.

**Who writes to it:** the API Suite agent owns this file. The Reviewer or the API Execution agent may append here when the mistake was in the collection itself — an entry belongs to the file of the agent that made it, not the agent that found it.

**What does not belong here:** live runs, startup, and process control go to `api-execution.md`; production-code causes to `backend-implementation.md`; test authoring to `unit-test.md`; UI to `frontend.md`. If the API suite stage is `disabled` in `PROJECT.md` → Optional stages, this file stays empty. `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom; never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets, tokens, or real identifiers, and record fixtures as role names and variable keys pointing at the fixture catalog (`PROJECT.md` → Paths) rather than restating live data.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — status code, assertion text, or runner output
**Why it happened**: the cause, classified as a collection defect, fixture state, or environment blocker
**Resolution**: what fixed it, the preflight that would have caught it earlier, and the evidence — requests executed, assertions passed, two consecutive clean runs
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### A request marked disabled in the editor still runs in the runner

**Obstacle**: a request left disabled in the collection file executed anyway under the command-line runner, and its assertion failed because the manual preflight it depends on had never been run.
**Why it happened**: the disabled flag is an editor hint; the command-line runner does not honor it.
**Resolution**: skip explicitly as the first statement of the request's pre-request script and keep the editor flag only as documentation. Any request that depends on a manual preflight skips itself when its precondition variable is unset.

### Reading a runner-injected value from the wrong variable scope

**Obstacle**: a pre-request script read a signing secret through the collection-variable accessor while the runner injected it as an environment variable, so the value was always empty and every request it signed failed.
**Why it happened**: collection and environment variables are separate scopes, and the collection-level accessor returns empty rather than erroring.
**Resolution**: read with the accessor that resolves across all scopes, keep the runner script the single place that maps environment keys to variable names, and assert the variable is non-empty in a preflight instead of discovering it through a downstream failure.

### Discovering fixtures through the throttled route family

**Obstacle**: fixture discovery ran against the externally-facing routes, which are rate limited, so each probe needed a multi-second wait and discovery dominated the step's wall time.
**Why it happened**: the same route family named by the ACs was reused for setup work, inheriting its limits.
**Resolution**: discover through the internal route family with the privileged setup credential, batch every candidate probe into one script that classifies results in memory, and reserve the AC route family for the assertions themselves.

### Identity ACs quietly running as the privileged account

**Obstacle**: identity-specific folders kept the default setup placeholders, so they ran as the privileged fixture account and looked like coverage. When one returned 401, the reflex was to repoint it at the privileged account for good.
**Why it happened**: setup credentials were treated as the caller under test, and the runner never forwarded the fixture-role variables.
**Resolution**: copy caller keys exactly from the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns) and have the runner forward every fixture-role variable. Setup and cleanup may use the privileged account; the request under assertion may not. A 401 on an identity AC whose setup passed is a suite wiring bug, not a reason to switch callers.

### Shared fixtures carrying state over from the previous run

**Obstacle**: ACs requiring a create-when-nothing-matches path failed because earlier runs had left matching rows behind, so the operation reactivated instead of creating. Deactivating the leftover did not free the uniqueness key, and one scope's failed cleanup blanked the plan for the other.
**Why it happened**: the uniqueness lookup ignores status, and the fixture is shared across every run of the suite.
**Resolution**: write a preflight that parks leftovers into a free slot, verify observable state with a read request before and after, restore through the same domain operation that created the state rather than a shortcut edit, and plan each scope independently. Do not report leftover data as a product defect until parking has succeeded.

### Claiming coverage the suite cannot actually prove

**Obstacle**: a success status was treated as proof that an asynchronous side effect carried the right content, and a heavy or unstable endpoint was handled by loosening its exact-count assertion instead of naming the limitation.
**Why it happened**: every AC row needed to close in this step, and no queue or message inspection was available to prove the rest.
**Resolution**: state which ACs the suite proves and which it cannot, mark the remainder as environment blockers naming the unit tests or log evidence that cover them, keep exact assertions exact, and hand deferrals that need the deployed environment to Step 5 or QA explicitly.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
