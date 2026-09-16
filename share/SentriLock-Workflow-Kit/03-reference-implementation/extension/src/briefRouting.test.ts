import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseBrief,
    parseReworkKind,
    shouldFireReviewRework,
    shouldFireCodeFixRework,
    getReviewReworkAgent,
    getReworkResumeTarget,
    getNextStep,
    shouldSkipDuplicateChat,
    processBriefChange,
    processQaBriefChange,
    createSessionState,
    createQaSessionState,
    SAME_COMMAND_COOLDOWN_MS,
    stepReadyToAdvance,
    qaStepReadyToAdvance,
    parseQaBrief,
} from './briefRouting';

const blockedReviewBrief = (loops: number, extra = '') => `
## Context
- Ticket ID: DEMO-1001
- Rework loops: ${loops}

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | ✅ Complete | |
| 4 — API Suite Generation | ✅ Complete | skipped |
| 5 — API Suite Execution | ✅ Complete | skipped |
| 6 — Backend Review | ⛔ Blocked — Rework Required | |

## Step 6 Summary — Review
**Verdict:** Blockers Found
${extra}
`;

describe('parseBrief', () => {
    it('reads blocked review + loop count', () => {
        const state = parseBrief(blockedReviewBrief(1, '**Rework target:** tests'));
        assert.equal(state.ticketId, 'DEMO-1001');
        assert.equal(state.reworkLoops, 1);
        assert.equal(state.reviewVerdict, 'blockers');
        assert.equal(state.reworkKind, 'tests');
        assert.ok(state.blockedSteps.has('6'));
        assert.ok(state.completedSteps.has('3'));
        assert.equal(state.completedSteps.has('6'), false);
    });

    it('treats a documented skipped stage as complete for routing', () => {
        const state = parseBrief(blockedReviewBrief(1).replace(
            '| 4 — API Suite Generation | ✅ Complete | skipped |',
            '| 4 — API Suite Generation | ⏭️ Skipped | disabled in PROJECT.md |'
        ));
        assert.ok(state.completedSteps.has('4'));
    });
});

describe('parseReworkKind', () => {
    it('defaults to unknown when the reviewer omitted the field', () => {
        assert.equal(parseReworkKind(blockedReviewBrief(1)), 'unknown');
    });

    it('reads code / tests / mixed from the last review section', () => {
        assert.equal(parseReworkKind(blockedReviewBrief(1, '**Rework target:** code')), 'code');
        assert.equal(parseReworkKind(blockedReviewBrief(1, 'Rework target: mixed')), 'mixed');
    });

    it('ignores an older Rework target when the latest review section omitted it', () => {
        const brief = `
## Step 6 Summary — Review
**Verdict:** Blockers Found
**Rework target:** tests

## Step 6 Summary — Review
**Verdict:** Blockers Found
A later loop with no target line.
`;
        assert.equal(parseReworkKind(brief), 'unknown');
    });

    it('uses the latest review section when both loops set a target', () => {
        const brief = `
## Step 6 Summary — Review
**Verdict:** Blockers Found
**Rework target:** tests

## Step 6 Summary — Review
**Verdict:** Blockers Found
**Rework target:** code
`;
        assert.equal(parseReworkKind(brief), 'code');
    });
});

describe('shouldFireReviewRework — double-open guard', () => {
    it('does not fire while reworkLoops is still 0 (status write before increment)', () => {
        const state = parseBrief(blockedReviewBrief(0, '**Rework target:** tests'));
        assert.equal(shouldFireReviewRework(state, -1, false), false);
        assert.equal(shouldFireReviewRework(state, 0, false), false);
    });

    it('fires once when loops increment to 1', () => {
        const state = parseBrief(blockedReviewBrief(1, '**Rework target:** tests'));
        assert.equal(shouldFireReviewRework(state, -1, false), true);
        assert.equal(shouldFireReviewRework(state, 0, false), true);
    });

    it('does not fire a second time for the same loop count', () => {
        const state = parseBrief(blockedReviewBrief(1, '**Rework target:** tests'));
        assert.equal(shouldFireReviewRework(state, 1, false), false);
    });

    it('does not fire while a rework return is already pending', () => {
        const state = parseBrief(blockedReviewBrief(1, '**Rework target:** tests'));
        assert.equal(shouldFireReviewRework(state, 0, true), false);
    });

    it('does not fire when a nested Code Fix Required is in play', () => {
        const brief = blockedReviewBrief(2, '**Rework target:** tests').replace(
            '| 3 — Unit Tests | ✅ Complete | |',
            '| 3 — Unit Tests | ⛔ Blocked — Code Fix Required | |'
        );
        const state = parseBrief(brief);
        assert.equal(shouldFireReviewRework(state, 1, false), false);
    });

    it('fires again on a later loop', () => {
        const state = parseBrief(blockedReviewBrief(2, '**Rework target:** code'));
        assert.equal(shouldFireReviewRework(state, 1, false), true);
    });
});

describe('shouldFireCodeFixRework', () => {
    const brief = `
- Ticket ID: DEMO-1
- Rework loops: 1
| 5 — API Suite Execution | ⛔ Blocked — Code Fix Required | |
`;
    it('requires loops >= 1 and a new loop index', () => {
        const state = parseBrief(brief);
        assert.equal(shouldFireCodeFixRework(state, -1, false), true);
        assert.equal(shouldFireCodeFixRework(parseBrief(brief.replace('loops: 1', 'loops: 0')), -1, false), false);
        assert.equal(shouldFireCodeFixRework(state, 1, false), false);
        assert.equal(shouldFireCodeFixRework(state, 0, true), false);
    });
});

describe('getReviewReworkAgent', () => {
    it('routes backend test blockers to /unit-test', () => {
        assert.equal(getReviewReworkAgent('6', 'tests').command, '/unit-test');
    });

    it('routes backend code/mixed/unknown blockers to /backend-implementation', () => {
        assert.equal(getReviewReworkAgent('6', 'code').command, '/backend-implementation');
        assert.equal(getReviewReworkAgent('6', 'mixed').command, '/backend-implementation');
        assert.equal(getReviewReworkAgent('6', 'unknown').command, '/backend-implementation');
    });

    it('routes frontend test blockers to /frontend-unit-test', () => {
        assert.equal(getReviewReworkAgent('6F', 'tests').command, '/frontend-unit-test');
        assert.equal(getReviewReworkAgent('6F', 'code').command, '/frontend-implementation');
    });
});

describe('getReworkResumeTarget', () => {
    it('continues the pipeline instead of jumping straight back to reviewer after code rework', () => {
        assert.equal(getReworkResumeTarget('6', 'code').command, '/unit-test');
        assert.equal(getReworkResumeTarget('6', 'tests').command, '/api-suite');
        assert.equal(getReworkResumeTarget('6F', 'code').command, '/frontend-unit-test');
        assert.equal(getReworkResumeTarget('6F', 'tests').command, '/frontend-reviewer');
        assert.equal(getReworkResumeTarget('5', 'code').command, '/api-execution');
    });
});

describe('getNextStep', () => {
    it('does not treat a completed Step 6 as a rework trigger', () => {
        const next = getNextStep('6', 'backend', 'blockers');
        assert.equal(next?.command, '/handoff');
    });
});

describe('shouldSkipDuplicateChat', () => {
    it('skips the same command inside the cooldown window', () => {
        const t0 = 1_000_000;
        assert.equal(shouldSkipDuplicateChat('/backend-implementation', '/backend-implementation', t0, t0 + 1000), true);
        assert.equal(
            shouldSkipDuplicateChat('/backend-implementation', '/backend-implementation', t0, t0 + SAME_COMMAND_COOLDOWN_MS + 1),
            false
        );
        assert.equal(shouldSkipDuplicateChat('/unit-test', '/backend-implementation', t0, t0 + 1000), false);
    });
});

describe('processBriefChange — watcher cycles', () => {
    const t0 = 1_700_000_000_000;
    const seeded = () => createSessionState({
        knownTicketId: 'DEMO-1001',
        notifiedSteps: new Set(['1', '2', '3', '4', '5']),
        lastNotifiedBlockedLoop: -1,
    });

    function restagedTestsBrief(loops: number): string {
        return `
## Context
- Ticket ID: DEMO-1001
- Rework loops: ${loops}

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | | |
| 4 — API Suite Generation | | |
| 5 — API Suite Execution | | |
| 6 — Backend Review | ⛔ Blocked — Rework Required | |

## Step 6 Summary — Review
**Verdict:** Blockers Found
**Rework target:** tests
`;
    }

    it('replays the DEMO-1001 double-open: blocked at loops=0, then increment, then recheck', () => {
        let session = seeded();
        const opened: string[] = [];

        const run = (brief: string, now: number) => {
            const result = processBriefChange(brief, session, { now });
            session = result.session;
            if (result.action.kind === 'open' && result.action.command) {
                opened.push(result.action.command);
            }
            return result.action;
        };

        // Reviewer write 1: status blocked, loops still 0.
        assert.equal(run(blockedReviewBrief(0, '**Rework target:** tests'), t0).kind, 'none');
        // Reviewer write 2: increment loops (and restage). This is what used to fire AND
        // then fire again when lastNotified went -1 → 0.
        assert.equal(run(blockedReviewBrief(1, '**Rework target:** tests'), t0 + 4000).command, '/unit-test');
        // pendingRecheck after the 12s delay / debounce.
        assert.equal(run(blockedReviewBrief(1, '**Rework target:** tests'), t0 + 16000).kind, 'none');
        // Same command inside the 25s cooldown, even if loop tracking were reset.
        assert.equal(run(blockedReviewBrief(1, '**Rework target:** tests'), t0 + 20000).kind, 'none');

        assert.deepEqual(opened, ['/unit-test']);
        assert.equal(session.lastNotifiedBlockedLoop, 1);
    });

    it('does not open /backend-implementation when later steps are restaged for a tests rework', () => {
        let session = seeded();
        const first = processBriefChange(restagedTestsBrief(1), session, { now: t0 });
        assert.equal(first.action.command, '/unit-test');
        // Step 1 stayed notified — restaging 3/4/5 must not look like an intake rerun.
        assert.ok(first.session.notifiedSteps.has('1'));
        assert.ok(first.session.notifiedSteps.has('2'));
        assert.equal(first.session.notifiedSteps.has('3'), false);

        const second = processBriefChange(restagedTestsBrief(1), first.session, { now: t0 + 5000 });
        assert.equal(second.action.kind, 'none');
    });

    it('does not reopen implementation when later steps are restaged while loops is still 0', () => {
        const first = processBriefChange(restagedTestsBrief(0), seeded(), { now: t0 });
        assert.equal(first.action.kind, 'none');
        assert.ok(first.session.notifiedSteps.has('1'));
        assert.ok(first.session.notifiedSteps.has('2'));
        assert.equal(first.session.notifiedSteps.has('3'), false);
        assert.equal(first.session.lastNotifiedBlockedLoop, -1);
        assert.equal(first.session.pendingReworkReturn, null);

        const second = processBriefChange(restagedTestsBrief(1), first.session, { now: t0 + 4000 });
        assert.equal(second.action.command, '/unit-test');
        assert.equal(second.session.lastNotifiedBlockedLoop, 1);
        assert.ok(second.session.notifiedSteps.has('1'));
        assert.ok(second.session.notifiedSteps.has('2'));

        const third = processBriefChange(restagedTestsBrief(1), second.session, { now: t0 + 16000 });
        assert.equal(third.action.kind, 'none');
    });

    it('opens implementation once for a code rework, then unit-test after a new Step 2 summary', () => {
        const codeBrief = blockedReviewBrief(1, '**Rework target:** code');
        let session = seeded();
        const first = processBriefChange(codeBrief, session, { now: t0 });
        assert.equal(first.action.command, '/backend-implementation');
        session = first.session;

        const afterImpl = codeBrief + '\n\n## Step 2 Summary — Implementation (Rework 2026-08-20)\nDone.\n';
        const second = processBriefChange(afterImpl, session, { now: t0 + 30_000 });
        assert.equal(second.action.command, '/unit-test');

        const third = processBriefChange(afterImpl, second.session, { now: t0 + 31_000 });
        assert.equal(third.action.kind, 'none');
    });

    it('continues to /api-suite after a tests rework writes a new Step 3 summary', () => {
        let session = seeded();
        const blocked = blockedReviewBrief(1, '**Rework target:** tests');
        const first = processBriefChange(blocked, session, { now: t0 });
        assert.equal(first.action.command, '/unit-test');

        const afterTests = blocked + '\n\n## Step 3 Summary — Unit Tests (Rework 2026-08-20)\nSibling-service tests added.\n';
        const second = processBriefChange(afterTests, first.session, { now: t0 + 30_000 });
        assert.equal(second.action.command, '/api-suite');
    });

    it('does not resume the pipeline from a Step 3 summary unless Step 3 is complete', () => {
        let session = seeded();
        const first = processBriefChange(restagedTestsBrief(1), session, { now: t0 });
        assert.equal(first.action.command, '/unit-test');

        const summaryOnly = restagedTestsBrief(1) + '\n\n## Step 3 Summary — Unit Tests (Rework 2026-08-20)\nWIP\n';
        const second = processBriefChange(summaryOnly, first.session, { now: t0 + 30_000 });
        assert.equal(second.action.kind, 'none');
        assert.ok(second.session.pendingReworkReturn);
    });

    it('resumes /api-suite after a restaged tests rework marks Step 3 complete', () => {
        let session = seeded();
        const first = processBriefChange(restagedTestsBrief(1), session, { now: t0 });
        assert.equal(first.action.command, '/unit-test');

        const done = restagedTestsBrief(1)
            .replace('| 3 — Unit Tests | | |', '| 3 — Unit Tests | ✅ Complete | |')
            + '\n\n## Step 3 Summary — Unit Tests (Rework 2026-08-20)\nCoverage added.\n';
        const second = processBriefChange(done, first.session, { now: t0 + 30_000 });
        assert.equal(second.action.command, '/api-suite');
    });

    it('opens implementation when a tests-rework unit-test pass finds a production bug', () => {
        let session = seeded();
        const first = processBriefChange(restagedTestsBrief(1), session, { now: t0 });
        assert.equal(first.action.command, '/unit-test');

        const codeFix = restagedTestsBrief(1)
            .replace('- Rework loops: 1', '- Rework loops: 2')
            .replace('| 3 — Unit Tests | | |', '| 3 — Unit Tests | ⛔ Blocked — Code Fix Required | |')
            + '\n\n## Step 3 Summary — Unit Tests (Rework 2026-08-20)\nProduction bug in MemberService.\n';
        const second = processBriefChange(codeFix, first.session, { now: t0 + 30_000 });
        assert.equal(second.action.command, '/backend-implementation');
        assert.equal(second.session.pendingReworkReturn?.returnCommand, '/unit-test');
    });

    it('hits the rework cap instead of opening another agent', () => {
        const session = seeded();
        session.lastNotifiedBlockedLoop = 4;
        const result = processBriefChange(
            blockedReviewBrief(5, '**Rework target:** tests'),
            session,
            { now: t0, reworkCap: 5 }
        );
        assert.equal(result.action.kind, 'cap');
        assert.equal(result.action.command, undefined);
    });

    it('opens implementation once for a Step 3 code-fix when loops increment to 1', () => {
        const brief = `
## Context
- Ticket ID: DEMO-1001
- Rework loops: 1

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | ⛔ Blocked — Code Fix Required | |
| 4 — API Suite Generation | | |
| 5 — API Suite Execution | | |
| 6 — Backend Review | | |
`;
        const session = createSessionState({
            knownTicketId: 'DEMO-1001',
            notifiedSteps: new Set(['1', '2']),
            lastNotifiedCodeFixLoop: -1,
        });
        const first = processBriefChange(brief, session, { now: t0 });
        assert.equal(first.action.command, '/backend-implementation');
        assert.equal(first.session.pendingReworkReturn?.returnCommand, '/unit-test');

        const second = processBriefChange(brief, first.session, { now: t0 + 5000 });
        assert.equal(second.action.kind, 'none');
    });

    it('does not open implementation for a Step 3 code-fix while loops is still 0', () => {
        const brief = `
- Ticket ID: DEMO-1001
- Rework loops: 0
| 3 — Unit Tests | ⛔ Blocked — Code Fix Required | |
`;
        const result = processBriefChange(
            brief,
            createSessionState({ knownTicketId: 'DEMO-1001', notifiedSteps: new Set(['1', '2']) }),
            { now: t0 }
        );
        assert.equal(result.action.kind, 'none');
    });

    it('does not consume a review loop when the rework command is in cooldown', () => {
        const session = seeded();
        session.lastOpenedCommand = '/unit-test';
        session.lastOpenedAt = t0;
        const first = processBriefChange(
            blockedReviewBrief(1, '**Rework target:** tests'),
            session,
            { now: t0 + 1000 }
        );
        assert.equal(first.action.kind, 'none');
        assert.equal(first.session.lastNotifiedBlockedLoop, -1);
        assert.equal(first.session.pendingReworkReturn, null);

        const second = processBriefChange(
            blockedReviewBrief(1, '**Rework target:** tests'),
            first.session,
            { now: t0 + SAME_COMMAND_COOLDOWN_MS + 1000 }
        );
        assert.equal(second.action.command, '/unit-test');
        assert.equal(second.session.lastNotifiedBlockedLoop, 1);
        assert.equal(second.session.pendingReworkReturn?.returnCommand, '/api-suite');
    });

    it('does not mark a completed step notified when its next chat is in cooldown', () => {
        const brief = `
## Context
- Ticket ID: DEMO-1001
- Rework loops: 0

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |

## Step 2 Summary — Implementation
Done.
`;
        const session = createSessionState({
            knownTicketId: 'DEMO-1001',
            notifiedSteps: new Set(['1']),
            lastOpenedCommand: '/unit-test',
            lastOpenedAt: t0,
        });
        const first = processBriefChange(brief, session, { now: t0 + 1000 });
        assert.equal(first.action.kind, 'none');
        assert.equal(first.session.notifiedSteps.has('2'), false);

        const second = processBriefChange(brief, first.session, { now: t0 + SAME_COMMAND_COOLDOWN_MS + 1000 });
        assert.equal(second.action.command, '/unit-test');
        assert.ok(second.session.notifiedSteps.has('2'));
    });

    it('keeps pending rework return when the resume chat is in cooldown', () => {
        const first = processBriefChange(restagedTestsBrief(1), seeded(), { now: t0 });
        assert.equal(first.action.command, '/unit-test');

        const done = restagedTestsBrief(1)
            .replace('| 3 — Unit Tests | | |', '| 3 — Unit Tests | ✅ Complete | |')
            + '\n\n## Step 3 Summary — Unit Tests (Rework 2026-08-20)\nCoverage added.\n';

        first.session.lastOpenedCommand = '/api-suite';
        first.session.lastOpenedAt = t0 + 30_000;

        const second = processBriefChange(done, first.session, { now: t0 + 30_000 + 1000 });
        assert.equal(second.action.kind, 'none');
        assert.equal(second.session.pendingReworkReturn?.returnCommand, '/api-suite');

        const third = processBriefChange(
            done,
            second.session,
            { now: t0 + 30_000 + SAME_COMMAND_COOLDOWN_MS + 1000 }
        );
        assert.equal(third.action.command, '/api-suite');
    });

    it('does not consume a code-fix loop when implementation is in cooldown', () => {
        const brief = `
## Context
- Ticket ID: DEMO-1001
- Rework loops: 1

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | ⛔ Blocked — Code Fix Required | |
`;
        const session = createSessionState({
            knownTicketId: 'DEMO-1001',
            notifiedSteps: new Set(['1', '2']),
            lastNotifiedCodeFixLoop: -1,
            lastOpenedCommand: '/backend-implementation',
            lastOpenedAt: t0,
        });
        const first = processBriefChange(brief, session, { now: t0 + 1000 });
        assert.equal(first.action.kind, 'none');
        assert.equal(first.session.lastNotifiedCodeFixLoop, -1);
        assert.equal(first.session.pendingReworkReturn, null);

        const second = processBriefChange(
            brief,
            first.session,
            { now: t0 + SAME_COMMAND_COOLDOWN_MS + 1000 }
        );
        assert.equal(second.action.command, '/backend-implementation');
        assert.equal(second.session.lastNotifiedCodeFixLoop, 1);
        assert.equal(second.session.pendingReworkReturn?.returnCommand, '/unit-test');
    });

    it('does not open the next agent until the completed step has a summary', () => {
        const briefNoSummary = `
## Context
- Ticket ID: DEMO-1

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | | |
`;
        const session = createSessionState({
            notifiedSteps: new Set(['1']),
            knownTicketId: 'DEMO-1',
        });
        const first = processBriefChange(briefNoSummary, session, { now: t0 });
        assert.equal(first.action.kind, 'none');
        assert.equal(first.session.notifiedSteps.has('2'), false);

        const withSummary = briefNoSummary + '\n## Step 2 Summary — Implementation\nDone.\n';
        const second = processBriefChange(withSummary, first.session, { now: t0 + 4000 });
        assert.equal(second.action.command, '/unit-test');
        assert.ok(second.session.notifiedSteps.has('2'));
    });

    it('does not skip ahead when an earlier completed step has no summary', () => {
        const brief = `
## Context
- Ticket ID: DEMO-1

## Track Classification
| **Track** | **Backend** |

## Workflow Progress
| Step | Status | Notes |
|------|--------|-------|
| 1 — Intake and Brief | ✅ Complete | |
| 2 — Backend Implementation | ✅ Complete | |
| 3 — Unit Tests | ✅ Complete | |

## Step 3 Summary — Unit Tests
Done.
`;
        const result = processBriefChange(
            brief,
            createSessionState({ notifiedSteps: new Set(['1']), knownTicketId: 'DEMO-1' }),
            { now: t0 }
        );
        assert.equal(result.action.kind, 'none');
        assert.equal(result.session.notifiedSteps.has('2'), false);
        assert.equal(result.session.notifiedSteps.has('3'), false);
    });
});

describe('stepReadyToAdvance', () => {
    it('requires a ticket id and classified track for Step 1', () => {
        const emptyTemplate = `
## Track Classification
| **Track** | **[Backend / Frontend / Full-Stack]** |

## Workflow Progress
| 1 — Intake and Brief | ✅ Complete | |
`;
        assert.equal(stepReadyToAdvance(emptyTemplate, '1'), false);
        assert.equal(stepReadyToAdvance(`
- Ticket ID: DEMO-99
## Track Classification
| **Track** | **Backend** |
`, '1'), true);
        assert.equal(stepReadyToAdvance(`
- Ticket ID: DEMO-99
## Track Classification
| **Track** | **[Backend / Frontend / Full-Stack]** |
`, '1'), false);
    });

    it('requires the matching Step N Summary heading', () => {
        const brief = `
## Step 2 Summary — Implementation
Done.
`;
        assert.equal(stepReadyToAdvance(brief, '2'), true);
        assert.equal(stepReadyToAdvance(brief, '3'), false);
        assert.equal(stepReadyToAdvance('## Step 2F Summary — Frontend Implementation\n', '2F'), true);
        assert.equal(stepReadyToAdvance('', '7'), true);
        assert.equal(stepReadyToAdvance('', '7F'), true);
    });
});

describe('qaStepReadyToAdvance', () => {
    it('requires a QA Step N Summary heading', () => {
        assert.equal(qaStepReadyToAdvance('- Ticket ID: DEMO-42\n', 1), false);
        assert.equal(qaStepReadyToAdvance('## QA Step 1 Summary — Intake\n- Ticket ID: DEMO-42\n', 1), true);
        assert.equal(qaStepReadyToAdvance('## QA Step 2 Summary — Test Generator\n', 2), true);
        assert.equal(qaStepReadyToAdvance('## QA Step 2 Summary — Test Generator\n', 3), false);
    });
});

const qaProgress = (statuses: [string, string, string, string]) => `
## QA Workflow Progress
| Step | Status |
|------|--------|
| QA-1 — Intake | ${statuses[0]} |
| QA-2 — Test Generator | ${statuses[1]} |
| QA-3 — Smoke Builder | ${statuses[2]} |
| QA-4 — Report | ${statuses[3]} |
`;

const qaSummariesThrough = (through: number) => {
    const titles = ['Intake', 'Test Generator', 'Smoke Builder', 'Report'];
    return Array.from({ length: through }, (_, i) =>
        `## QA Step ${i + 1} Summary — ${titles[i]}\nDone.\n`
    ).join('\n');
};

const qaBrief = (opts: {
    ticket?: string;
    statuses?: [string, string, string, string];
    throughSummary?: number;
}) => {
    const ticket = opts.ticket ?? 'DEMO-2001';
    const statuses = opts.statuses ?? ['✅ Complete', '✅ Complete', '✅ Complete', ''];
    const through = opts.throughSummary ?? 3;
    return `- Ticket ID: ${ticket}\n${qaProgress(statuses)}\n${qaSummariesThrough(through)}`;
};

describe('parseQaBrief', () => {
    it('reads ticket id and Complete rows', () => {
        const state = parseQaBrief(qaBrief({
            statuses: ['✅ Complete', '✅ Complete', '', ''],
            throughSummary: 2,
        }));
        assert.equal(state.ticketId, 'DEMO-2001');
        assert.deepEqual([...state.completedSteps].sort(), [1, 2]);
    });

    it('treats a documented skipped QA stage as complete', () => {
        const state = parseQaBrief(qaBrief({
            statuses: ['⏭️ Skipped', '', '', ''],
            throughSummary: 1,
        }));
        assert.deepEqual([...state.completedSteps], [1]);
    });
});

describe('processQaBriefChange', () => {
    const t0 = 1700000000000;

    it('opens /qa-test-generator when QA-1 completes with a summary', () => {
        const result = processQaBriefChange(
            qaBrief({ statuses: ['✅ Complete', '', '', ''], throughSummary: 1 }),
            createQaSessionState({ knownTicketId: 'DEMO-2001' }),
            { now: t0 }
        );
        assert.equal(result.action.command, '/qa-test-generator');
        assert.ok(result.session.notifiedSteps.has(1));
    });

    it('opens /qa-report when QA-3 completes and does not replay QA-2', () => {
        const result = processQaBriefChange(
            qaBrief({
                statuses: ['✅ Complete', '✅ Complete', '✅ Complete', ''],
                throughSummary: 3,
            }),
            createQaSessionState({
                knownTicketId: 'DEMO-2001',
                notifiedSteps: new Set([1, 2]),
            }),
            { now: t0 }
        );
        assert.equal(result.action.command, '/qa-report');
        assert.equal(result.action.kind, 'open');
    });

    it('does not reopen /qa-test-generator after QA-4 completes', () => {
        const done = qaBrief({
            statuses: ['✅ Complete', '✅ Complete', '✅ Complete', '✅ Complete'],
            throughSummary: 4,
        });
        const result = processQaBriefChange(
            done,
            createQaSessionState({
                knownTicketId: 'DEMO-2001',
                notifiedSteps: new Set([1, 2, 3]),
            }),
            { now: t0 }
        );
        assert.equal(result.action.kind, 'none');
        assert.ok(result.session.notifiedSteps.has(4));
    });

    it('does not reopen /qa-test-generator when the report rewrite drops then restores the progress table', () => {
        let session = createQaSessionState({
            knownTicketId: 'DEMO-2001',
            notifiedSteps: new Set([1, 2, 3]),
        });

        // QA-4 writes the report first: summaries stay, Complete rows disappear.
        const reportBody = `- Ticket ID: DEMO-2001\n\n${qaSummariesThrough(4)}`;
        const mid = processQaBriefChange(reportBody, session, { now: t0 });
        assert.equal(mid.action.kind, 'none');
        session = mid.session;

        // Then the table comes back with all four Complete — this used to fire QA-2.
        const restored = qaBrief({
            statuses: ['✅ Complete', '✅ Complete', '✅ Complete', '✅ Complete'],
            throughSummary: 4,
        });
        const after = processQaBriefChange(restored, session, { now: t0 + 4000 });
        assert.equal(after.action.kind, 'none');
        assert.equal(after.action.command, undefined);
        assert.ok(after.session.notifiedSteps.has(1));
        assert.ok(after.session.notifiedSteps.has(4));
    });

    it('does not replay from QA-1 when notifiedSteps is empty and QA-4 is already complete', () => {
        const result = processQaBriefChange(
            qaBrief({
                statuses: ['✅ Complete', '✅ Complete', '✅ Complete', '✅ Complete'],
                throughSummary: 4,
            }),
            createQaSessionState({ knownTicketId: 'DEMO-2001' }),
            { now: t0 }
        );
        assert.equal(result.action.kind, 'none');
        assert.deepEqual([...result.session.notifiedSteps].sort(), [1, 2, 3, 4]);
    });

    it('clears state on intake truncate so a new QA-1 can open the test generator', () => {
        const cleared = processQaBriefChange(
            '',
            createQaSessionState({
                knownTicketId: 'DEMO-2001',
                notifiedSteps: new Set([1, 2, 3, 4]),
            }),
            { now: t0 }
        );
        assert.equal(cleared.action.kind, 'none');
        assert.equal(cleared.session.notifiedSteps.size, 0);

        const next = processQaBriefChange(
            qaBrief({ ticket: 'DEMO-2001', statuses: ['✅ Complete', '', '', ''], throughSummary: 1 }),
            cleared.session,
            { now: t0 + 4000 }
        );
        assert.equal(next.action.command, '/qa-test-generator');
    });
});
