# Agent Error Log — Unit Test (Step 3)

## What this file is for

Reusable pitfalls in writing and running unit tests: mocking traps, fake and in-memory data stores, runner and test-host aborts, and coverage gaps that looked like coverage. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** the Unit Test agent (`/unit-test`) before writing or running tests, together with `misc.md`. The Reviewer reads it when auditing coverage, and the QA Test Generator reads it for runner and test-host aborts.

**Who writes to it:** the Unit Test agent owns this file. The Reviewer may append here when the mistake was made in Step 3. Production-code causes belong in `backend-implementation.md` even when a test exposed them; component-test causes belong in `frontend.md`.

**What does not belong here:** collections and fixture discovery (`api-suite.md`), live runs and process control (`api-execution.md`), environment and workflow routing (`misc.md`). `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom and never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets or machine paths, and name the test that proves it: an entry without a repeatable check is a rumor.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — failing assertion, abort text, or the gap that shipped
**Why it happened**: the cause, and whether it is test setup or a real product defect
**Resolution**: the fix, the gate that would have caught it earlier, and the test name plus command that ran green
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### Asserting on a mocked layer only, so the real query never runs

**Obstacle**: a data-access change was "covered" by tests that stubbed the data layer and returned a canned list, so a wrong filter, wrong source table, or wrong join shipped green.
**Why it happened**: mock-based tests are the default shape in the suite and the diff looked like ordinary orchestration work.
**Resolution**: when the change is a query or predicate, seed a real in-memory or fake store and execute it, including at least one row that must be **excluded**. Stub only collaborators outside the unit under test.

### One layer passing while the next layer cannot consume the result

**Obstacle**: an alternate authentication path passed its middleware test because the pipeline continued, but the handler downstream could not resolve an identity at all — nothing populated the state that path depends on.
**Why it happened**: middleware and handler were tested independently and neither test crossed the boundary between them.
**Resolution**: for cross-cutting identity or auth changes, assert that the **downstream** layer receives a usable identity on every path, and exercise config-gated features in both the enabled and disabled state.

### Testing only the repository the ticket's title mentioned

**Obstacle**: a multi-repository ticket shipped production changes in a second repository with no tests, and review blocked it.
**Why it happened**: the coverage habit was scoped to the primary backend repository, so the sibling's behavior was described as "covered over there".
**Resolution**: Step 3 runs the configured test command in **every** repository listed in the Step 2 changed-files table, in the same pass. If a sibling suite lacks the package needed to execute a real query, add it. Missing sibling coverage is a blocker with `**Rework target:** tests`.

### Weakening or relabeling an assertion to get a green run

**Obstacle**: an AC about a status code under a specific caller was marked covered by a test that called the handler directly, set no credentials, ran no middleware, and asserted no status code — the AC sentence had simply been copied into the test comment. Elsewhere an exact-count assertion was loosened to "any 4xx" to dodge a flaky response.
**Why it happened**: the row needed to close, and the wording made the coverage look real.
**Resolution**: a direct call proves payload shape only. Status codes, authorization, and pipeline behavior go through the pipeline — an in-process test host, a live probe, or the contract suite. If the environment blocks real proof, record an environment blocker naming what is still unproven; never lower the bar to close a row.

### Treating a test-store limitation as a product defect

**Obstacle**: seeding a fake store threw on required non-nullable fields, and elsewhere the code under test threw because the store does not support transactions. The run was reported as a code-fix blocker.
**Why it happened**: the exceptions named production methods, so they read as persistence bugs.
**Resolution**: configure the test store — relax the null checks, stamp the required audit fields, or ignore the unsupported-feature warning — and keep its version aligned with the production data layer. Harness configuration failures are never `⛔ Blocked — Code Fix Required`, and never a reason to edit production code.

### Citing an earlier run's numbers when this run aborted

**Obstacle**: the test host aborted because a required runtime version was missing on the machine, and the summary quoted pass counts from a previous session.
**Why it happened**: the abort was read as environment noise rather than a missing finish gate.
**Resolution**: export the documented compatibility or roll-forward setting before the command, retry once, and if it aborts again say so plainly. Review and handoff require a fresh green run from this session or an explicit note that the retry also failed — never inherited counts, and never a filtered run in place of the configured finish gate.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
