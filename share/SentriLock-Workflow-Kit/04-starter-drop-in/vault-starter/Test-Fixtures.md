# Fixture catalog (starter)

Replace this table with **your** disposable test records. Do not put production people here.

| Role in tests | Id / key | Notes |
|---------------|----------|--------|
| Active record used in smoke | `<fill>` | Must exist in the configured test environment; never create in production |
| Record used for “not found” | `<fill>` | Stable unused id |

Rules:

- Parameterize. Prompts and suites read this file; they must not invent ids.
- If a record is dirty and blocks PATCHes, fix it or pick another — do not bypass validation.
- Keep this file committed only if it contains no secrets.
