# AI Workflow Evaluation Scorecard

Use this scorecard weekly on a fixed set of representative tickets.

## Benchmark Set

Track at least 10 tickets across:
- Bug fix
- New endpoint
- Validation rule change
- Refactor
- Test backfill

## Metrics (Per Ticket)

| Metric | Target | How to Measure |
|---|---:|---|
| Time to first working PR-ready diff | <= baseline - 20% | Start at intake, stop at compile+tests pass |
| Human rework ratio | <= 25% | Lines materially rewritten by human / total AI-generated lines |
| Compile success on first pass | >= 80% | Build pass before first human edit |
| Unit test pass rate | 100% | Configured unit-test finish gate |
| API/contract suite pass rate | 100% | Configured suite command for changed contracts |
| Regression escape rate | 0 high severity | Defects found after merge tied to ticket |
| AC completeness | 100% | All AC items mapped to evidence |
| Agent rework loops | 0 | Times an agent looped back to re-implement during the workflow run |

## Scoring Rubric

Score each ticket 0-2:
- 0 = misses target
- 1 = partial target
- 2 = meets or exceeds target

Total ticket score:
- 12-14: ready for broader rollout
- 8-11: promising, improve prompts/workflow
- <= 7: redesign workflow before scaling

## Evidence Log

Scorecard entries are **automatically appended** to `.github/ai/EVAL_LOG.md` by the Handoff Agent at the end of each ticket. You do not need to fill in entries manually.

Two metrics require post-PR data and are left as `?` in each entry — fill these in after the PR is reviewed:
- `Human rework ratio` — lines materially rewritten by a human / total AI-generated lines
- `Time to PR-ready diff` — elapsed time from `/intake-agent` to first compile+tests-pass

To review the log: open `.github/ai/EVAL_LOG.md`. Each entry is a `##` section with the ticket ID.

## Weekly Review Questions

1. Which agent step causes most rework?
2. Which AC types are repeatedly missed?
3. Are suite failures mostly data/setup or code defects?
4. Which vault docs are stale and causing wrong outputs?
5. Which prompts should be tightened this week?
