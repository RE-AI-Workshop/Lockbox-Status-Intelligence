# Brief protocol (do not casually restyle)

The extension regexes these forms. If you change them, change `briefRouting.ts` and the tests.

## Dev

```
- Ticket ID: DEMO-100
- Rework loops: 0
```

Track (one of): `Backend` / `Frontend` / `Full-Stack` in the classification table.

```
| Step | Status | Notes |
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | | |
```

Blocked:

```
| 6 — Backend Review | ⛔ Blocked — Rework Required |
**Rework target:** tests
```

or

```
| 5 — API Suite Execution | ⛔ Blocked — Code Fix Required |
```

At the loop cap (5), the reviewer writes this instead and routing stops for a human:

```
| 6 — Backend Review | ⛔ Blocked — Loop Cap Reached |
```

Stages disabled in `PROJECT.md` still need a summary before the row counts as done:

```
| 4 — API Suite Generation | ⏭️ Skipped |
```

Summaries:

```
## Step 2 Summary — Implementation
## Step 2 Summary — Implementation (Rework 2026-09-08)
## Step 6 Summary — Review
```

The heading must exist before the status cell flips. Only the `## Step N Summary` prefix is matched, so a trailing `— Title` is free text.

Verdict line in the last review section: `Verdict: Approved` or contains `blocker`.

Clarify (Step 1 will not auto-advance):

```
- ⚠️ NEEDS CLARIFICATION: …
```

## QA

```
| QA-1 — Intake | ✅ Complete |
## QA Step 1 Summary
```

## Clean slate

Intake **truncates** `active-brief.md` and `EVAL_LOG.md` with a shell redirect (`: > file`). Do not switch that to an editor replace of empty-with-empty (it no-ops).
