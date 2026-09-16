# AGENTS.md — behavioral contract for this vault

This file is **law** for coding agents. Navigation lives in `README.md`.

## MUST

- Read the matching note in this vault before generating a request or UI flow.
- Use documented field names and enum codes exactly.
- Parameterize ids and environment URLs. Never hardcode them.
- For partial updates: read current server state first; send only the intended change.
- Preserve null vs empty string when the protocol treats them differently.
- Surface validation error details from error responses.
- Ignore unknown fields in responses (do not hard-fail on additive changes).

## MUST NOT

- Invent enum values or field names.
- Send credentials in query parameters.
- Bypass entity validation with a “god mode” test user.
- Depend on JSON key order.
- Write to production, run migrations, or commit without an explicit human.

## Safety

Ask a human before deletes, transfers, bulk jobs that can hit a rate limit, or any production write.

## After you learn something

Edit the **existing** note. Do not leave the discovery only in chat.
