# Test conventions and patterns

Patterns discovered during test-writing runs. Maintained by the Unit Test Agent.
All agents should read this file before writing tests. Any agent that discovers a reusable test pattern should append it here.

Project-specific commands, suite paths, fixture keys, and layer names come from `.github/ai/PROJECT.md` — read it first and never guess a `<placeholder>`. This file holds the transferable technique; `PROJECT.md` holds the values.

**Location rule:** This file is committed to the repository so all developers and agents can access it. Do NOT write testing patterns into an agent memory store — write them here.

---

## Isolating a validation guard from the data layer

Validation guards belong before the transaction or persistence call starts (`PROJECT.md` → Architecture → Validation guard placement) precisely so unit tests can reach them without a database. To test a guard without any real data access, construct the orchestration object with a null or empty data-access dependency: the guard throws before anything touches it.

```
service = new OrchestrationService(dataContext: null, dataAccess: mockDataAccess, ...)
error   = assertThrows(DomainException) { service.method(invalidInput) }
assertEquals(ExpectedMessages.Constant, error.message)
```

If the guard does *not* throw, the null dependency produces a null-reference error instead — a useful signal that the guard is placed after the transaction boundary and needs to move.

## Triple-case pattern for validation guards

Every guard gets three tests:

1. **Fail**: bad input → guard throws / returns error
2. **Pass**: valid input → guard does not throw; execution reaches the next layer (verify the mock was called)
3. **Non-applicable**: field absent from the request → guard is skipped entirely (verify the mock was called with no mutation)

The third case is the one most often missing. Without it, a guard that fires on absent fields looks correct.

## Partial-update test structure

Partial-update requests (JSON Patch, PATCH bodies, merge payloads) need two mocks:

1. A read mock that returns the current entity state
2. The update call itself (test-then-replace pairs, where the payload format has them)

Null and empty string are not equivalent — test both separately when a field is nullable. Same for zero versus absent on numeric identifiers: a payload that omits a field and a payload that sends `0` usually travel different code paths.

## Transport-layer mocking

Transport-layer tests (controllers, handlers, route functions) mock the orchestration interface, not the data-access layer. Never reach through the transport layer into orchestration internals.

```
mockService = mock(IEntityService)
mockService.setup(s => s.getEntity(entityId)).returns(fakeResponse)
controller = new EntityController(mockService)
```

If a transport test needs data-access mocks to pass, the business logic has leaked out of the orchestration layer — that is a finding, not a test problem.

## Domain code values in fixtures

Never invent status or type codes. Use values from the status and domain codes doc (`PROJECT.md` → Paths → Status and domain codes) or existing constants/enums in the repository. Record the safe values your project uses here as you confirm them, for example:

- active status code
- primary/default type code
- the code that marks a record inactive but still writable

A fixture built on an invented code passes the unit test and fails the first real request.

## In-memory database for data-access predicate tests

When the changed behavior lives inside a data-access query predicate, mock-based orchestration tests do not validate the logic at all — they assert what the mock was told to return. Use the ORM's in-memory provider so the actual query executes:

```
options = new DbContextOptionsBuilder<AppDataContext>()
    .UseInMemoryDatabase(newGuid())   // unique store per test
    .Options
context = new AppDataContext(options)
```

- Use a fresh unique store name per test so tests cannot see each other's rows.
- Check how your context stamps audit timestamps. Many implementations only protect the created-timestamp on **update**, not on **insert**, which means a seeded created-timestamp survives the save and can be asserted.
- If the code under test uses two separate contexts, create separate in-memory stores with different names for each.
- Do not seed optional side tables unless the test exercises that path. An empty related set short-circuits the query without evaluating conversions inside the predicate.

## In-memory provider versus database null semantics

In-memory providers evaluate predicates as ordinary in-process code, while the real database applies SQL null semantics. A predicate that reads a nullable field's inner value (`nullableField.value.date` and similar) throws in memory when the field is null; the real database silently excludes those rows.

To avoid a false failure:

- Only seed records with non-null values for nullable fields used in the predicate.
- Document the null-exclusion behavior in a comment rather than writing a null-seeded in-memory test.
- The null path is covered by database semantics in production — no in-memory test is needed for it.

Never "fix" this by loosening the production predicate to satisfy the in-memory provider.

## Adding the in-memory provider to the test suite

The configured unit test suite (`PROJECT.md` → Paths → Unit test project/suite) may not reference the in-memory provider package by default. Add it, pinned to **the same major version as the production ORM package** in that repository. A mismatched provider version produces failures that look like product defects.

## Data-access constructor pattern for in-memory tests

Data-access classes often have long constructors. Give the test the real context plus real collaborators for anything whose query must execute, and mocks or nulls for the rest:

```
logger      = mock(ILogger<EntityDataAccess>)
userLookup  = mock(IUserDataAccess)
dataAccess  = new EntityDataAccess(context, logger, userLookup, secondaryContext, referenceDataAccess)
```

Choose deliberately between a bare stub and a configured mock:

- Bare stub is fine when the value under test is passed **into** the method as a parameter.
- A configured mock with an explicit return is required when the method fetches that value **internally**; otherwise the internal call returns null and the branch you meant to test never runs.

## In-memory tests with complex joins and subqueries

In-memory providers handle multi-table joins, unions, contains-subqueries, and correlated cross-joins correctly, because they run as in-process object queries. Storage-level model configuration (index clustering, identity columns, and similar) is silently ignored — no workaround needed.

The real risk is seeding. Every row a join touches must exist and must satisfy the join condition. For a date-bounded cross-join, ensure each seeded record's date falls on the matching side of the boundary, or the query returns empty and the test appears to prove the opposite of what it asserts.

## Step 2: run the existing regression tests against Local

Backend Implementation must run the configured **Regression tests** command (`PROJECT.md` → Commands) after a successful build and **before** marking Step 2 `✅ Complete`. This is a different gate from the Step 2 **regression scan** (a code search) and from post-deploy QA (which targets the deployed Test environment).

**Why:** ticket work often changes the HTTP contract that existing regression tests still assert. If Step 2 skips this run, QA or deploy is the first place those tests fail — and agents then "fix" the wrong layer.

**Target:** source the local environment file and keep its base URL (`PROJECT.md` → Test environments → Local). Do **not** override the base URL to the deployed Test environment — that tests yesterday's deploy, not this ticket's build.

**Restart the local app** after the build so the process loads the new code. Health-check before running the suite.

```bash
set -a && source ./.env.local && set +a && \
<PROJECT.md → Commands → Regression tests>
```

If the run aborts for a runtime/host reason rather than a test failure, retry once with the same command before treating it as a blocker.

**Triage each failure before editing:**

| Class | Meaning | Action |
|---|---|---|
| Stale test | AC intentionally changed the contract the test asserts | Fix the test (minimum diff). Assert the **new** AC. Do not weaken to "any 4xx". |
| Code issue | Unexpected 500, wrong persist, sibling verb still old, AC not met | Fix production code, rebuild, restart the app, re-run. |
| Environment / harness | Connection reset, throttling response, test host abort, app down | Restart / retry / harness only. Do not change validation or product assertions because of a transport error. |
| Unrelated pre-existing | A path this ticket did not change and cannot have caused | Document; do not expand scope. |

Do not write a new QA-style suite in Step 2. Only update existing files the ticket made incorrect. New coverage belongs to `/qa-test-generator`.

The finish gate is a full-suite run. A filtered run is for diagnosing one class, not for Complete.

---

## Bug regression tests in API suites

For bug-fix tickets, the API suite should include at least one **regression test** that would **fail if the fix were reverted**. AC-level tests verify correct behavior; a regression test specifically targets the broken logic path.

**Pattern:**

1. Create a fixture that triggers the exact scenario the old code got wrong.
2. Name the assertion `BUG REGRESSION: <description>` so reviewers understand its purpose.
3. Assert the **correct** behavior that the old code **incorrectly produced**.

**Example (DEMO-123):** a report query filtered on the wrong related table, so records that satisfied an unrelated requirement were excluded. The regression test seeds a row in the wrong table only, then asserts the record still appears in the report. The old code excluded it; the fixed code ignores that table.

**When to use:**

- Wrong-table / wrong-column bugs: seed the wrong table and assert it does not affect the result.
- Missing-filter bugs: seed a record the missing filter should have caught.
- Deduplication bugs: seed multiple records that would have produced duplicate rows.

**When not needed:** purely additive fixes (new endpoint, new field) with no broken prior behavior to regress to.

## Regression test: rate limits and transport retries

Route families for external callers may be rate limited (`PROJECT.md` → Architecture → Rate limits). Whether limiting happens in the application or at the network layer changes over time, so tests should not depend on a whitelist entry.

**Include a retry for the throttling status as a safety net**, and in deploy/release regression also retry transport-level connection failures. Do **not** retry HTTP 500 — that hides a real product error.

```
sendWithRetry(request):
  for attempt in 0..3:
    if attempt > 0:
      rebuildRequestBody()          // a sent body cannot be replayed
      sleep(2000 * attempt)
    response = client.send(request)
    if response.status == 429 and attempt < 3: continue
    return response
```

Do **not** add global semaphores or fixed multi-second delays between requests — they no longer buy anything and they slow every run and deploy.

## Regression test: reading a created record's id from the response

For external-caller create endpoints, the response body may omit the internal id because the serializer strips internal fields for external callers. The id is usually still available in the `Location` response header.

```
extractIdFromLocation(response):
  location = response.headers.location  ?? fail("201 response missing Location header")
  id       = parseQuery(location)["id"] ?? fail("Location header missing id param")
  return toInt(id)
```

Prefer this over a follow-up search request: it asserts the create response contract instead of assuming it.

## Mocking the HTTP client factory for outbound calls

When a service resolves clients from an HTTP client factory (for example an external identity provider token exchange), mock the message handler's send method and wrap it in a real client:

```
mockHandler.setupProtected("SendAsync", anyRequest, anyToken)
  .returns(new Response(status: 200, body: '{"access_token":"at"}'))

httpClient  = new HttpClient(mockHandler)
mockFactory = mock(IHttpClientFactory)
mockFactory.setup(f => f.createClient(anyString())).returns(httpClient)
```

This tests service methods that make outbound calls without hitting real endpoints. Match on specific request URLs when one method calls more than one endpoint, or the wrong stub answers.

## Transport tests with request header dependencies

For handlers that read a custom request header, set the header on the fake request before assigning the context:

```
context = new FakeHttpContext()
context.request.headers["<custom-header>"] = "test-value"
controller.controllerContext = new ControllerContext(context)
```

To verify response headers the handler sets, read them from the response object after the action executes, not from the request context.

## Testing middleware with dependencies injected per call

Some middleware receives its dependencies as parameters of the invoke method rather than through the constructor. Mock each one and pass it into the call:

```
await middleware.invoke(context, mockTokenService, mockAuthService)
```

Track whether the pipeline continued by setting a flag inside the next-delegate:

```
nextCalled = false
next = (ctx) => { nextCalled = true; return completed() }
```

Asserting only that the pipeline continued is weak coverage — see the identity note below about proving the downstream layer can consume what the middleware decided.

## Testing protected base-class methods

For protected members on a shared transport base class, create a testable subclass in the test project that exposes the member:

```
class TestableControllerBase extends ControllerBase:
  constructor(config, userService) : base(config, userService)
  publicWrapper() => protectedMethodUnderTest()
```

Do not widen the production member's visibility to make it testable.

## Testing telemetry and enrichment hooks

Telemetry initializers and similar cross-cutting enrichment hooks receive an item to enrich and read ambient request state. Inject a fake context accessor with the state you want:

```
context = new FakeHttpContext()
context.request.path   = "/api/Entity/123"
context.request.method = "POST"
context.items["SESSION_INFO"] = new SessionInfo(username: "user")
context.request.body   = seekableStream('{"test":true}')
mockAccessor.setup(a => a.httpContext).returns(context)

initializer.initialize(telemetryItem)
assertEquals("user", telemetryItem.properties["username"])
```

- Use a request-shaped telemetry item for tests that should trigger enrichment.
- Use a non-request item to verify pass-through behavior.
- Use a **seekable** stream for request bodies; a forward-only stream is consumed by the first reader.
- Test body truncation by supplying a body larger than the configured limit and asserting the truncation marker.
- Redaction is the point of these hooks: assert that credential-bearing fields never reach the sink.

## Identity-pattern fixtures

When tests touch login, authorization, roles, internal-versus-external callers, or publisher identity, fixtures come from the **column-defined caller shapes** in the identity patterns doc (`PROJECT.md` → Paths → Identity/caller patterns), not from a named production user.

API suites: copy **exact** fixture-role variable keys from that doc's environment login map (`PROJECT.md` → Fixture roles). The runner forwards those variables to the suite runner. The privileged fixture caller is fixture setup only, never the caller under assertion.

- Label each such test with the caller-shape id from the identity patterns doc.
- A privileged/administrative session is fixture **setup**, not coverage of synthetic staff stubs, service-account writers, or affiliated-organization writers.
- Treat a negative, zero, and positive person/actor identifier as three different callers. Treat a stub identity with id `0` and a real identity with id `> 0` as two different login paths even when the username string is identical.
- Litmus: would this fixture set have caught the external-identity-provider login for a user with no local account, or a write attributed to the wrong publisher identity?

**Required, not optional, when that caller shape applies:**

- **External identity provider login** — exercise the real resolver with a lookup that returns a synthetic stub (id `0`). A dual-mode HTTP request does not reach that method.
- **Publisher identity** — capture the outbound publish and assert the resolved sender for an affiliated writer versus the fallback for an unaffiliated one. HTTP 200 on the write is not this assertion.
- **Unaffiliated parent write** — assert that it does not publish at all, and does not fall back.

See also the login resolution section below.

## Setting up session identity for internal-route transport tests

Where a token middleware resolves identity for internal routes, transport tests on those routes must populate the session item the middleware would have set — the username header is no longer read there:

```
context.items["SESSION_INFO"] = new SessionInfo(
    preferredUsername: "<privileged-fixture-role>",
    id: 1, memberId: 0, personId: 1,
    roles: ["<privileged-role-claim>"],
    organizations: [1000])
```

For external route families, continue using the basic auth header plus the user-lookup mock. Mixing the two produces tests that pass while the real route returns 401.

## Capturing publish bodies from a non-injectable HTTP client

When a utility constructs its own HTTP client inline, you cannot inject a handler. Capture the request with a real loopback listener instead:

1. Bind a free loopback port (bind port `0` and read back the assigned port).
2. Start an HTTP listener on that prefix.
3. Point the in-memory configuration for the publish target at that prefix (with the trailing slash) and set the matching authorization value.
4. Start accepting **before** calling the method under test, because a synchronous send blocks the caller until the listener responds.
5. Read the request stream, respond `200`, and parse the body into the envelope type.
6. For "no publish expected" cases, wait with a short timeout and assert that no request arrived.

Keep this helper in one place in the test suite so every publish assertion uses the same capture.

## Login resolution tests

Identity resolution frequently has **two separate resolvers** — test both whenever login behavior changes.

| Resolver | Entry | Test file |
|----------|-------|-----------|
| Credential/email resolver | the email or credential login route | `<resolver test file>` |
| Token/claims resolver | the token authorization route | `<resolver test file>` |

**Required edge-case coverage for credential/email login changes:**

1. **Service-account header** — service accounts (negative or zero actor id) must fall through to the email lookup, not resolve as the service account itself
2. **Proxy elevation** — only the one documented delegating service account may elevate; other service accounts and an explicit id parameter must **not**
3. **Username before email** — an impersonating caller sends the internal username (positive actor id); it must win over a shared administrative email
4. **External-route id gate** — referrer/cookie/id hints are honored only for the specific service accounts documented for that flow; internal dual-mode routes stay id-first
5. **Referrer parsing** — a referrer query id that belongs to a different entity type must not be parsed as a user id
6. **Secondary email fallback** — the alternate lookup runs when the primary email lookup fails

**Required edge-case coverage for token/claims login changes:**

1. **Synthetic stub with id `0`** — the lookup returns a stub; the resolver must fall through to email rather than querying by id `0`
2. **Real user id `> 0`** — resolved directly by the token's username claim
3. **Service account with negative or zero actor id** — falls through to email

Mock pattern: mock the user data-access lookups (by username, by email, by alternate email, by id) and construct the orchestration service with other dependencies nulled or mocked.

Domain reference: the login edge-case doc and the identity patterns doc (`PROJECT.md` → Paths). Login tests must include every applicable caller shape, especially the synthetic stub versus a real account with a role claim, and a zero-actor-id service account versus a negative one.

## Testing internal-caller gates when the session always marks internal

If the session-based resolver hard-codes the caller as internal, transport tests that need a **non-internal** caller on an internal route cannot use the session path at all.

**Pattern:** enable the dual-mode setting in in-memory configuration and resolve through the username header instead:

```
config = inMemoryConfig({ "Auth:DualModeEnabled": "true" })
mockUserService.setup(s => s.getUser("ext.user"))
  .returns(new User(username: "ext.user", personId: -1))   // → non-internal
// no session item; set the username header instead
```

An empty or whitespace username on the session item still exercises the handler's blank-username branch while staying on the session path — useful when you need that branch without leaving the session mechanism.

## In-memory seeding for multi-table search joins

A search query that joins user → person → organization (local and state) → office needs all four seeded before any cap or filter assertion means anything. If the query then calls a second lookup per result, empty rows for that lookup are fine.

- Cap assertion: seed more than the cap (for example 101 matching rows) and assert the result count equals the cap.
- Guard assertion: seed the administrative variant and assert that a non-positive organization id returns empty, proving the guard branch, not the search branch.

## Sibling-repository in-memory tests: provider version and non-nullable fields

An additional service repository (`PROJECT.md` → Repositories) usually runs a different ORM major version than the primary backend. Add the in-memory provider at **that** repository's version.

Newer ORM versions validate non-nullable reference properties on save, so seeds that worked in the primary repository fail with "required properties are missing". Either stamp those fields or disable null checks for the store:

```
options = new DbContextOptionsBuilder<AppDataContext>()
    .UseInMemoryDatabase(newGuid(), b => b.enableNullChecks(false))
    .Options
```

Stamp the audit fields anyway if you want seeds to resemble production rows. Unique store name per test, as always.

## Envelope fields versus serialized payload

When a message envelope carries routing fields alongside a serialized payload string, those routing fields belong on the **envelope**, never inside the serialized payload. Capture the publish and assert all three:

1. The envelope field holds the expected collection (or is omitted when empty).
2. Parsing the serialized payload shows the field is absent there.
3. A privileged caller that short-circuits sender classification does not require the affiliation lookups at all.

Update-stamping helpers may require source-system and source-method values on the test user; without them the save path throws for reasons unrelated to the behavior under test.

## Route-template tests must assert absolute paths

When a step adds method-level routes for a second route family on a handler that already has a class-level prefix, reflection tests must verify **absolute** route templates — not merely that a substring appears.

**Insufficient (passes with broken routing):**

```
assertContains(routes, t => t.contains("ext/[controller]/Login/Email"))
```

**Required:**

```
assertAll(externalRoutes, t => assertStartsWith("/ext/", t))
// or per endpoint:
assertContains("/ext/[controller]/Login/Email", routes)
```

A relative template without a leading slash registers underneath the class prefix (`/api/Entity/ext/Entity/Login/Email`) and the intended path 404s at runtime. A successful build does not validate the route table. Step 4's route probes (expect non-404 on every AC path) are the final gate. (DEMO-123)

## Middleware safe-error envelope

A safe-error writer is easiest to prove through the public invoke path: have the next-delegate throw, then assert the response JSON carries the error code, correlation id, and a safe message, that the content type includes the charset, and that the exception text is **absent**.

Set the response body to a seekable buffer before invoking so the restored original stream is readable afterwards. If the middleware's request-body formatter disposes the request stream, wrap test bodies in a stream whose dispose is a no-op — otherwise the second read (or the next-delegate itself) never runs.

## Named HTTP client and encoding capture

Outbound token-exchange tests should assert the **named** client was requested from the factory (the name is a contract with configuration), and should capture the raw request bytes in the handler's send setup. Assert the content type's charset and reject a byte-order mark.

Do not assert the absence of a null character on the decoded string — decoding hides the problem. Check the raw bytes if you need that guard.

## Fire-and-forget outbound POST capture

An indexer or notifier that constructs its own client inline and posts to more than one endpoint needs a listener that keeps accepting: respond `200` to **every** request, because one accept leaves the second send waiting on the client's default timeout (often around 100 seconds, which looks like a hang, not a failure).

If the method returns before its work completes (a fire-and-forget signature), do not wait on the caller returning. Complete a promise/task-completion source from the first accepted request and wait on that instead, or the capture is empty and the assertion silently passes on nothing.

## Service-registration tests: assert the collection, not a built provider

Tests that call the startup registration method and then build a provider can fail while resolving unrelated services, because telemetry and hosting integrations register options that need a hosting environment.

Inspect the **service collection** for the registration you care about (the factory interface, the named-client options type) instead of resolving it, or register a hosting environment before building the provider. Also assert the constants the production code uses for the client name and timeout — those are what tie the registration to the caller.

## Regression on the deploy environment: skip missing credentials, never fail

The deploy pipeline injects only the base URL and standard caller credentials recorded in `PROJECT.md` → Test environments / Fixture roles. It has no token signing secret and no specialized identity keys.

- The dual-mode client is the deploy path for internal routes. A 200 there is not bearer-token coverage — do not "fix" that gap by failing when no token secret is present.
- Token-only tests use an environment-conditional skip attribute naming the variables they need.
- Identity HTTP tests use an environment-conditional skip on the **exact** fixture-role key, and create the client **inside the test method**.
- Never construct environment-dependent clients in a class constructor — a missing variable then fails every test in that class instead of skipping one.
- Use the suite's skip mechanism. Do not assert-false on a missing secret.
- If an external test management system is enabled, confirm its importer maps a skipped result to "not applicable" rather than "retest"; that usually requires passing the mapping config explicitly.

## Regression: unset or chunked content length

A standard string-content request always sets a content length, so it cannot prove a buffer-allocation guard. Use a content type whose length computation returns false, and force HTTP/1.1 with chunked transfer for the chunked case. Assert the response is not a 500; prefer the specific validation status the AC names for an empty body.

## Regression: inactive related-record fixtures split by route family

When a response shape depends on a related record's active flag, you need three fixtures, all named in the fixture catalog (`PROJECT.md` → Paths → Fixture catalog): one with an **inactive** related record, one with an **active** one, and one with **none**.

Assert the split by route family: the external family returns the reduced stub (id `0`, no descriptive fields) while the internal family keeps the full payload; the record with no related row returns the validation status. An active related record is a no-op for the stub/full split, so it cannot prove it. Reference the catalog constants; do not invent ids.

## Hydrate-before-publish completeness tests

When a write publishes a hydrated persisted record rather than the request object, completeness tests must stub the reload path or the reload throws before any assertion runs:

1. The primary reload returns a populated aggregate (person, name, related slice, post-write primaries).
2. Every child lookup the reload calls returns a **non-null** list; empty is fine.
3. Any collection the code indexes into (`[0].field`) must return **at least one** element — count-based stubbing is not enough.
4. For the related parent aggregate, stub both its own lookup and its secondary-collection lookup.
5. Reload-null tests deliberately omit those stubs so hydrate falls back to the sparse request — that keeps the envelope-only tests green.

Asserting a field is null fails when the serializer wrote an explicit JSON null: check for "absent **or** JSON-null", not language null.

## Publish-capture helper needs its own dependency seeding

A shared publish-capture helper builds its own copy of the publish utility. If that copy gets bare stubs for the lookups sender classification uses, classification throws before the fallback or skip branch, and the test looks like "no publish" instead of failing loudly.

Give the helper an optional dependency-configuration callback and seed the lookups on **the capture helper's** dependencies, not the service's — they are different mock graphs. Caller shapes that short-circuit classification (privileged, restricted-edit, affiliated) never reach those lookups and do not need the seed. Have the helper always stamp source-system and source-method on its writer so update-stamping does not throw.

## Regression: destructive-write restore and identity clients

A move/transfer style write is destructive. Regression cleanup is a **second write back to the original values** inside a try/finally using the standard internal caller; a partial-update helper is the wrong tool because it cannot restore the relationships the write moved. Pre-flight a read and restore first if a prior run died mid-cleanup.

- A sparse request still has to include the current primary relationship ids — validation treats `0` as missing.
- Do not send a destination value for a relationship that is already current; same-value validation is a no-op at best and a validation failure at worst.
- For a parent aggregate with no "already primary" guard, park it elsewhere first so the restore is a real move.
- The HTTP body must not contain envelope-only fields. Do not assert serialized-payload or publisher identity over HTTP; those are unit-test assertions.
- Specialized identity clients are not on the deploy pipeline: mark those tests environment-conditional and create the client inside the method. Standard-caller tests stay unconditional, and the privileged caller covers validation and liveness only.
- Serialize tests that share a mutable fixture into one non-parallel collection so read tests cannot race the restore.

## Regression: field locks and full-replace payloads

When a field is locked because another operation owns it, characterize both payload shapes, in a non-parallel collection so unrelated field mutations cannot race the restore.

**Partial update**

- Any replace of a locked field returns the validation status with the lock message — including the same value, `0`, null, and empty string. The lock must run **before** existence and type checks, so an invalid id must not return the "not a valid reference" message instead.
- A test-only operation with no replace is not a change (expect success, values unchanged).
- A record whose inactive state forbids writes returns the restricted-fields error **before** the lock. Assert the status and that nothing persisted; do not require the lock message, and do not activate the record to get past it.

**Full replace**

- Do not replay a raw read snapshot: nested collections fail validation. Clone the snapshot, set every array **and** every known null collection property to `[]`, and change only the scalar under test.
- A capture-and-restore helper is unsafe with an uncleaned snapshot. Restore the scalar with a partial update instead.
- Omitting both relationship ids defaults one to `0` and trips the incomplete-body create guard before the lock. To reach the lock, zero or omit the field under test and keep the current value for the other.
- Fail-path writes must never persist a new value. Use the catalog constants for the lock target and the destination, and confirm the persisted values afterwards.

## In-memory provider and transactions

In-memory providers do not support transactions. Opening one raises a warning that the provider surfaces as an exception unless the test context ignores it:

```
options = new DbContextOptionsBuilder<AppDataContext>()
    .UseInMemoryDatabase(newGuid())
    .configureWarnings(w => w.ignore(TransactionIgnoredWarning))
    .Options
```

Use this whenever the method under test opens a transaction. Predicate execution still works; the transaction is a no-op. Do not classify the throw as `⛔ Blocked — Code Fix Required` — it is test-context configuration, not a persistence defect.

## Data-access constructor for transactional persist tests

A persist path usually needs far less than its constructor suggests: the context, plus a **real** collaborator for any dependency whose own query must execute against the same context (unique-key lookups, for example). Everything else can be a bare stub or null.

Check the small requirements before blaming the code:

- Update stamping needs source-method and source-system values on the test user.
- A timestamp the code casts to a non-nullable type must be seeded non-null.
- Understand which values come from the **request** (the previous/losing relationships) and which come from the **destination** fields, or the assertion checks the wrong side of the move. (DEMO-123)
