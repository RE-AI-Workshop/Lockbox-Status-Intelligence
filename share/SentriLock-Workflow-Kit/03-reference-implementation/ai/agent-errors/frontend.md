# Agent Error Log — Frontend (Steps 2F / 3F / 6F / 7F)

## What this file is for

Reusable UI pitfalls: component state and lifecycle ordering, asynchronous bootstrap, HTTP client interceptors, cross-application session handoff, and component-test setup. It is a lessons file, not a defect tracker: an entry earns its place only if an agent on a different ticket would act differently after reading it.

**Who reads it:** every frontend agent — Frontend Implementation (2F), Frontend Unit Test (3F), Frontend Reviewer (6F), and Frontend Handoff (7F) — before writing or testing UI code, together with `misc.md`.

**Who writes to it:** all four frontend agents share this file. The Frontend Reviewer appends here for UI mistakes and to `misc.md` for workflow-only ones — an entry belongs to the file of the agent that made it, not the agent that found it.

**What does not belong here:** backend, data-access, contract-suite, and runner lessons live in the other files in this folder. Do not copy them here, and do not write UI lessons into those files — cross-reference instead. `README.md` in this folder holds the full read/write matrix.

## Entry format

Append newest at the bottom; never rewrite or delete an existing entry — if a later ticket proves one wrong, append an `**Update**:` line beneath it. One lesson per entry, reusable past one ticket, no secrets, tokens, or real user identifiers, and reference components, state modules, and routes by the paths in `PROJECT.md` → Paths, naming the symbol rather than a line number.

```
## YYYY-MM-DD — Short title (DEMO-123)

**Obstacle**: the symptom — what the user or test saw, the console error, and when it fired
**Why it happened**: the cause, including the lifecycle phase or async ordering involved
**Resolution**: what fixed it, the guard or shared helper that prevents a repeat, the test that proves it, and any out-of-scope siblings that still carry the pattern
```

## Starter entries

Stack-agnostic lessons carried over from earlier projects. Keep them and append your own below.

### Parsing cached storage during synchronous component initialization

**Obstacle**: views read a cached object out of browser storage inside their initial state function and dereferenced it immediately. Parsing missing data yields null, so the view threw before bootstrap finished — reliably on first login and on deep links.
**Why it happened**: bootstrap is asynchronous and initial state cannot await the store, so the component ran before anything had populated the cache.
**Resolution**: route every read through one shared session-cache helper that tolerates missing and malformed data, and have views read from the shared store with a safe default instead of from storage. List the out-of-scope siblings that still parse unguarded so a follow-up ticket can pick them up.

### A local state property shadowing a computed of the same name

**Obstacle**: a view defined both a computed value and a local state property under the same name. The setter wrote the local copy while the template rendered the computed, so a successful update appeared to do nothing.
**Why it happened**: the local property was left behind when the value moved to the store, and neither the framework nor the build warns about the collision.
**Resolution**: keep one source per name — remove the local property once a computed or store-backed value exists — and assert in a test that the rendered value changes after the update, not merely that the setter ran.

### Treating a known backend quirk as a session expiry

**Obstacle**: an endpoint returned an unauthorized status together with a complete, valid body. The HTTP client read the status as session expiry, cleared the token, and redirected to the expired-session route, so bootstrap could never populate its lookup data.
**Why it happened**: the interceptor keys on status code alone, which is right everywhere except this one endpoint.
**Resolution**: special-case the exact endpoint and body shape in the interceptor, resolve that response instead of clearing the session, and keep the guard as narrow as possible. File the status-code defect against the backend and cross-reference it — never change the backend auth pipeline from the frontend track.

### Sending mutually exclusive session-handoff flags together

**Obstacle**: two query parameters meaning different session modes were sent on the same cross-application handoff. The receiving app treated the session as ordinary, raced its own login call, and resolved the wrong identity.
**Why it happened**: the flags were added by different features and never documented as exclusive, so combining them looked harmless.
**Resolution**: document one flag combination per handoff mode and send exactly one. Where the referring URL may be reduced to its origin, pass the identifier explicitly through a parameter or cross-domain cookie rather than inferring it, and cover each mode with its own test.

### Stubbing only the field under test when mounting a component

**Obstacle**: a mount test failed on an undefined model binding even though the field under test was switched off and its lookup data was empty.
**Why it happened**: unrelated sections of the template always render and bind their own model paths, so a partial stub cannot survive first paint.
**Resolution**: stub every model path the template evaluates on first paint, not just the field under test, then assert the ACs on the computed option lists after a successful mount — so the test proves the data shape rather than only that mounting did not throw.

### Importing a script that runs its checks on load

**Obstacle**: importing a build-verification script inside a test killed the test runner outright.
**Why it happened**: the script is a command-line gate, not a module: it executes at import time and terminates the process on failure.
**Resolution**: spawn it as a child process and assert on its exit code and output. When it inspects a build output directory, move the existing directory aside, write fixture files, run the script, and restore the original afterward — including when the assertion fails.

## A note on these entries

Entries accumulate per project: each ticket that surfaces a non-obvious trap adds one, and the file grows more useful over time. They exist to save the next agent a rework loop — a shared engineering record, not self-criticism, and not a performance log for any agent or person.
