# Identity and fixtures

Describe caller **roles/shapes**, not people. Put key names in `PROJECT.md` and detailed disposable records in the configured fixture catalog. Secret values stay in local environment configuration.

Use a privileged role to arrange test data; use the actual role under test to prove authorization behavior. Never “fix” a 401/403 by switching the assertion to an admin identity. Smoke verifies liveness and should not impersonate every caller role.
