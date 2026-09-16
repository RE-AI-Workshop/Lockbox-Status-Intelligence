# API Suite Task Template

## Objective

Generate or update API suites for the changed endpoints (`/api-suite`), then execute them and report results.

## Inputs

- Ticket ID:
- Changed endpoints:
- Route family (`PROJECT.md` → Architecture → Route families):
- Data mutation risk: Low/Medium/High

## Required Suite Content

Fixture-first, cyclical data: every suite creates what it needs, asserts against it, then deletes it, so a rerun starts from the same state.

- Fixture setup request(s) — create the records the assertions need, using the privileged fixture role
- Happy path request(s)
- Validation/error path request(s)
- Authorization path request(s) when applicable — the request under assertion uses the caller the AC names, never the privileged role as a substitute
- Cleanup request(s) for every created record, in reverse creation order

## Variables Contract

Required variables (`PROJECT.md` → Test environments and Fixture roles):
- base URL variable for the target environment
- privileged fixture role key
- standard caller key
- additional route-family caller key (when that family is covered)

Identity-sensitive ACs: copy the **exact** fixture-role keys from `PROJECT.md` → Fixture roles and the identity patterns doc. Do not invent a key that is not in the catalog. Privileged fixture setup is not caller coverage. Never use a downstream sync identity as a caller.

## Execution Commands

Run the configured **API/contract suite** command (`PROJECT.md` → Commands) against the collection directory (`PROJECT.md` → Paths → API collection directory). Postman/Newman is one example runner.

If `PROJECT.md` → Optional stages sets **API suite** to `disabled`, append the step summary explaining why and mark the row `⏭️ Skipped` instead of inventing a test stack.

## Expected Output Format

- Suites changed:
- Command executed:
- Environment (Local for Steps 2-5):
- Pass count:
- Fail count:
- Failure root cause:
  - Suite/data issue
  - Code behavior issue
- Next action:
