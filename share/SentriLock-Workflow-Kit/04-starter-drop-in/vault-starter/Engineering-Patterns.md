# Recurring patterns (starter)

Use this file for **mistakes agents repeat** and project-wide engineering patterns, not ticket-specific notes.

## Add a pattern when

- Two tickets hit the same bug class
- A review finding is about process, not this one AC
- A test green-path hid a real failure mode

## Template

```
## Short name

**Symptom**:
**Wrong approach**:
**Correct approach**:
**Where it lives in code**:
```

## Starter rules (keep even before you have history)

- Do not bypass entity validation with a god-mode test user.
- Read current server state before a partial update.
- Parameterize ids. Do not hardcode environment URLs in committed tests.
- Write the lesson here (or in `agent-errors/`) so the next ticket sees it.
