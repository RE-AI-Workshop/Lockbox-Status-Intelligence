# Suite / collection conventions (starter)

Document project-specific contract-test conventions here. The command and artifact path belong in `PROJECT.md`.

## Cyclical data

Every mutating test is: **create → assert → delete** (or equivalent rollback). A leftover fixture from a crashed run is a bug in the suite, not “environment flake.”

## Privileged setup vs caller under test

- Setup and cleanup may use a privileged fixture account.
- The assertion request uses the **caller the AC names**.
- Do not “fix” a 401 by switching the assertion to admin.

## Do not use a validation-bypass user

If your platform has a sync/system account that skips validators, **do not** use it in suites. Failed setup means the body is wrong — fix the body.

## Rate limits

If a path is rate-limited, wait or isolate. Do not disable the limiter for tests.

## Local vs deployed

Dev suite execution is against the **local** process you just built. QA smoke is against the **deployed** URL. Do not mix them.
