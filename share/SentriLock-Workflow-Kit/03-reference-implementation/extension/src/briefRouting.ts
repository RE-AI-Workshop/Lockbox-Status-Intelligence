// Routing and brief parsing for the project workflow extension.
// Kept free of vscode imports so it can be unit-tested with node:test.

export interface StepTarget {
    command: string;
    label: string;
}

export type TicketTrack = 'backend' | 'frontend' | 'full-stack' | 'unknown';
export type ReviewVerdict = 'approved' | 'blockers' | 'unknown';
/** Reviewer-classified destination for a Step 6 / 6F rework loop. */
export type ReworkKind = 'code' | 'tests' | 'mixed' | 'unknown';
export type SummaryStepKey = '2' | '2F' | '3' | '3F' | '4' | '5';

export const NEXT_STEP: Record<string, StepTarget> = {
    '1':  { command: '/backend-implementation', label: 'Backend Implementation (Step 2)' },
    '2':  { command: '/unit-test',              label: 'Unit Tests (Step 3)'             },
    '3':  { command: '/api-suite',              label: 'API Suite Generation (Step 4)'   },
    '4':  { command: '/api-execution',          label: 'API Suite Execution (Step 5)'    },
    '5':  { command: '/reviewer',               label: 'Backend Review (Step 6)'         },
    '6':  { command: '/handoff',                label: 'Backend Handoff (Step 7)'        },
    '2F': { command: '/frontend-unit-test',     label: 'Frontend Unit Tests (Step 3F)'   },
    '3F': { command: '/frontend-reviewer',      label: 'Frontend Review (Step 6F)'       },
    '6F': { command: '/frontend-handoff',       label: 'Frontend Handoff (Step 7F)'      },
};

export const STEP_ORDER = ['1', '2', '3', '4', '5', '6', '7', '2F', '3F', '6F', '7F'];

export interface BriefState {
    ticketId: string;
    completedSteps: Set<string>;
    blockedSteps: Set<string>;
    codeFixBlockedSteps: Set<string>;
    reworkLoops: number;
    track: TicketTrack;
    reviewVerdict: ReviewVerdict;
    reworkKind: ReworkKind;
    step2SummaryCount: number;
    step2FSummaryCount: number;
    step3SummaryCount: number;
    step3FSummaryCount: number;
    step4SummaryCount: number;
    step5SummaryCount: number;
}

export interface PendingReworkReturn {
    blockedStep: string;
    returnCommand: string;
    returnLabel: string;
    summaryCountAtBlock: number;
    summaryStepKey: SummaryStepKey;
}

export function getNextStep(
    completedStep: string,
    track: TicketTrack,
    _reviewVerdict?: ReviewVerdict
): StepTarget | null {
    if (completedStep === '1') {
        if (track === 'frontend') {
            return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F)' };
        }
        return NEXT_STEP['1'];
    }

    // Review blockers are handled by shouldFireReviewRework + getReviewReworkAgent,
    // not by treating Step 6 / 6F as complete.
    if (completedStep === '7') {
        if (track === 'full-stack') {
            return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F) — Full-Stack' };
        }
        return null;
    }

    if (completedStep === '7F') {
        return null;
    }

    return NEXT_STEP[completedStep] ?? null;
}

/**
 * Agent to open when a review (or code-fix) step is blocked.
 * Review blockers honor the reviewer's Rework target (code vs tests).
 * Unknown / mixed default to implementation so missing tests still get a code pass first.
 */
export function getReviewReworkAgent(blockedStep: string, reworkKind: ReworkKind): StepTarget {
    const tests = reworkKind === 'tests';

    if (blockedStep === '6F' || blockedStep === '3F') {
        if (tests && blockedStep === '6F') {
            return { command: '/frontend-unit-test', label: 'Frontend Unit Tests (Step 3F) — Rework from Review' };
        }
        return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F) — Rework' };
    }

    if (tests && blockedStep === '6') {
        return { command: '/unit-test', label: 'Unit Tests (Step 3) — Rework from Review' };
    }

    return { command: '/backend-implementation', label: 'Backend Implementation (Step 2) — Rework' };
}

/** After the rework agent finishes, which command resumes the pipeline. */
export function getReworkResumeTarget(blockedStep: string, reworkKind: ReworkKind): StepTarget {
    if (blockedStep === '5') {
        return { command: '/api-execution', label: 'API Suite Execution (Step 5)' };
    }
    if (blockedStep === '3F') {
        return { command: '/frontend-unit-test', label: 'Frontend Unit Tests (Step 3F)' };
    }
    if (blockedStep === '6F') {
        if (reworkKind === 'tests') {
            return { command: '/frontend-reviewer', label: 'Frontend Review (Step 6F)' };
        }
        return { command: '/frontend-unit-test', label: 'Frontend Unit Tests (Step 3F)' };
    }
    // Step 6 review (tests → suite, code → unit-test) or Step 3/5 code-fix
    // (callers pass reworkKind 'code', which resumes at /unit-test).
    if (reworkKind === 'tests') {
        return { command: '/api-suite', label: 'API Suite Generation (Step 4)' };
    }
    return { command: '/unit-test', label: 'Unit Tests (Step 3)' };
}

export function summaryCountFor(state: BriefState, key: SummaryStepKey): number {
    switch (key) {
        case '2': return state.step2SummaryCount;
        case '2F': return state.step2FSummaryCount;
        case '3': return state.step3SummaryCount;
        case '3F': return state.step3FSummaryCount;
        case '4': return state.step4SummaryCount;
        case '5': return state.step5SummaryCount;
    }
}

/** Which summary heading increments when the rework agent we just opened finishes. */
export function summaryKeyForReworkAgent(command: string): SummaryStepKey {
    switch (command) {
        case '/backend-implementation': return '2';
        case '/frontend-implementation': return '2F';
        case '/unit-test': return '3';
        case '/frontend-unit-test': return '3F';
        case '/api-suite': return '4';
        case '/api-execution': return '5';
        default: return '2';
    }
}

/**
 * Fire a review rework at most once per incremented loop.
 * Requires reworkLoops >= 1 so the reviewer's first "Blocked" write (loops still 0)
 * does not open an agent, and the later increment cannot open a second copy.
 */
export function shouldFireReviewRework(
    state: BriefState,
    lastNotifiedBlockedLoop: number,
    hasPendingReworkReturn: boolean
): boolean {
    const blockedReviewStep = state.blockedSteps.has('6') ? '6'
        : state.blockedSteps.has('6F') ? '6F'
        : null;

    return Boolean(
        blockedReviewStep &&
        state.reviewVerdict === 'blockers' &&
        state.reworkLoops >= 1 &&
        state.reworkLoops > lastNotifiedBlockedLoop &&
        !hasPendingReworkReturn &&
        state.codeFixBlockedSteps.size === 0
    );
}

export function shouldFireCodeFixRework(
    state: BriefState,
    lastNotifiedCodeFixLoop: number,
    hasPendingReworkReturn: boolean
): boolean {
    return state.codeFixBlockedSteps.size > 0
        && state.reworkLoops >= 1
        && state.reworkLoops > lastNotifiedCodeFixLoop
        && !hasPendingReworkReturn;
}

export function blockedReviewStepOf(state: BriefState): '6' | '6F' | null {
    if (state.blockedSteps.has('6')) { return '6'; }
    if (state.blockedSteps.has('6F')) { return '6F'; }
    return null;
}

export function lastReviewSection(content: string): string {
    const reviewSectionRegex = /## Step 6F? Summary [—\-] (?:Backend |Frontend )?Review[\s\S]*?(?=\n##\s|$)/g;
    let match: RegExpExecArray | null;
    let last = '';
    while ((match = reviewSectionRegex.exec(content)) !== null) {
        last = match[0];
    }
    return last;
}

export function parseReviewVerdict(content: string): ReviewVerdict {
    const section = lastReviewSection(content);
    if (!section) {
        return 'unknown';
    }

    const verdictMatch = section.match(/\*\*?Verdict\*\*?:\s*(.+)/i)
        ?? section.match(/Verdict:\s*(.+)/i);

    if (!verdictMatch) {
        return 'unknown';
    }

    const verdict = verdictMatch[1].trim();
    if (/approved/i.test(verdict)) {
        return 'approved';
    }
    if (/blocker/i.test(verdict)) {
        return 'blockers';
    }
    return 'unknown';
}

export function parseReworkKind(content: string): ReworkKind {
    // Last review section only — an older loop's target must not win if this
    // section omitted the field (defaults to implementation via 'unknown').
    const section = lastReviewSection(content);
    if (!section) {
        return 'unknown';
    }
    const match = section.match(/Rework target:\s*\**\s*(code|tests|mixed)\b/i);
    return match ? match[1].toLowerCase() as ReworkKind : 'unknown';
}

function countHeadings(content: string, pattern: RegExp): number {
    return (content.match(pattern) || []).length;
}

export function parseBrief(content: string): BriefState {
    const ticketMatch = content.match(/^[-*]\s*Ticket ID:\s*(.+)$/m);
    const ticketId = ticketMatch ? ticketMatch[1].trim() : '';

    const completedSteps = new Set<string>();
    const rowRegex = /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*(?:✅\s*Complete|⏭️?\s*Skipped)/g;
    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(content)) !== null) {
        completedSteps.add(m[1]);
    }

    const blockedSteps = new Set<string>();
    const blockedRowRegex = /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*⛔\s*Blocked/g;
    while ((m = blockedRowRegex.exec(content)) !== null) {
        blockedSteps.add(m[1]);
    }

    const codeFixBlockedSteps = new Set<string>();
    const codeFixBlockedRegex = /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*⛔\s*Blocked\s*[—\-]\s*Code\s*Fix\s*Required/g;
    while ((m = codeFixBlockedRegex.exec(content)) !== null) {
        codeFixBlockedSteps.add(m[1]);
    }

    const reworkLoopsMatch = content.match(/[-*]\s*Rework loops:\s*(\d+)/);
    const reworkLoops = reworkLoopsMatch ? parseInt(reworkLoopsMatch[1], 10) : 0;

    let track: TicketTrack = 'unknown';
    if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Full[- ]?Stack\*{0,2}/i.test(content)) { track = 'full-stack'; }
    else if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Frontend\*{0,2}/i.test(content)) { track = 'frontend'; }
    else if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Backend\*{0,2}/i.test(content)) { track = 'backend'; }

    return {
        ticketId,
        completedSteps,
        blockedSteps,
        codeFixBlockedSteps,
        reworkLoops,
        track,
        reviewVerdict: parseReviewVerdict(content),
        reworkKind: parseReworkKind(content),
        step2SummaryCount: countHeadings(content, /## Step 2 Summary/g),
        step2FSummaryCount: countHeadings(content, /## Step 2F Summary/g),
        step3SummaryCount: countHeadings(content, /## Step 3 Summary/g),
        step3FSummaryCount: countHeadings(content, /## Step 3F Summary/g),
        step4SummaryCount: countHeadings(content, /## Step 4 Summary/g),
        step5SummaryCount: countHeadings(content, /## Step 5 Summary/g),
    };
}

export const QA_NEXT_STEP: Record<number, StepTarget> = {
    1: { command: '/qa-test-generator', label: 'QA Test Generator (QA Step 2)' },
    2: { command: '/qa-smoke-builder',  label: 'QA Smoke Builder (QA Step 3)'  },
    3: { command: '/qa-report',         label: 'QA Report (QA Step 4)'         },
};

export interface QaBriefState {
    ticketId: string;
    completedSteps: Set<number>;
}

export function parseQaBrief(content: string): QaBriefState {
    const ticketMatch = content.match(/^[-*]\s*Ticket ID:\s*(.+)$/m);
    const ticketId = ticketMatch ? ticketMatch[1].trim() : '';
    const completedSteps = new Set<number>();
    const rowRegex = /\|\s*QA-(\d)\s*[—\-][^|]*\|\s*(?:✅\s*Complete|⏭️?\s*Skipped)/g;
    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(content)) !== null) {
        completedSteps.add(parseInt(m[1], 10));
    }
    return { ticketId, completedSteps };
}

export function getNextQaStep(completedStep: number): StepTarget | null {
    if (completedStep === 4) {
        return null;
    }
    return QA_NEXT_STEP[completedStep] ?? null;
}

/** QA-1/2/3/4: that step's summary heading is present. */
export function qaStepReadyToAdvance(content: string, step: number): boolean {
    return new RegExp(`## QA Step ${step} Summary\\b`).test(content);
}

export interface QaSessionState {
    notifiedSteps: Set<number>;
    knownTicketId: string;
    lastOpenedCommand?: string;
    lastOpenedAt?: number;
}

export function createQaSessionState(partial?: Partial<QaSessionState>): QaSessionState {
    return {
        notifiedSteps: new Set(partial?.notifiedSteps ?? []),
        knownTicketId: partial?.knownTicketId ?? '',
        lastOpenedCommand: partial?.lastOpenedCommand,
        lastOpenedAt: partial?.lastOpenedAt,
    };
}

function cloneQaSession(session: QaSessionState): QaSessionState {
    return createQaSessionState({
        ...session,
        notifiedSteps: new Set(session.notifiedSteps),
    });
}

const QA_SUMMARY_PRESENT = /## QA Step \d Summary\b/;

function applyQaSessionReset(session: QaSessionState, state: QaBriefState, content: string): void {
    // Ignore a transient empty ticket (report rewrite) so it cannot look like a new ticket.
    if (/^[A-Z][A-Z0-9_-]*-\d+$/i.test(state.ticketId) && state.ticketId !== session.knownTicketId) {
        session.notifiedSteps.clear();
        session.knownTicketId = state.ticketId;
        return;
    }

    const disappeared = [...session.notifiedSteps].filter(s => !state.completedSteps.has(s));
    if (disappeared.length === 0) {
        return;
    }

    // Intake clean slate: no Complete rows and no step summaries.
    // A missing progress table while summaries remain is a report rewrite, not a new run.
    if (state.completedSteps.size === 0 && !QA_SUMMARY_PRESENT.test(content)) {
        session.notifiedSteps.clear();
        return;
    }
    for (const step of disappeared) {
        session.notifiedSteps.delete(step);
    }
}

export interface ProcessQaBriefResult {
    action: BriefAction;
    session: QaSessionState;
}

/**
 * One QA file-watcher cycle. Completing QA-4 must not reopen QA-2.
 * A report rewrite that temporarily drops the progress table is not a new ticket.
 */
export function processQaBriefChange(
    content: string,
    sessionIn: QaSessionState,
    options?: { now?: number }
): ProcessQaBriefResult {
    const now = options?.now ?? Date.now();
    const session = cloneQaSession(sessionIn);
    const state = parseQaBrief(content);
    const none: BriefAction = { kind: 'none' };

    applyQaSessionReset(session, state, content);

    const maxCompleted = state.completedSteps.size > 0 ? Math.max(...state.completedSteps) : 0;
    if (maxCompleted === 4 && qaStepReadyToAdvance(content, 4)) {
        for (const step of state.completedSteps) {
            session.notifiedSteps.add(step);
        }
        return { action: none, session };
    }

    const newSteps = [...state.completedSteps]
        .filter(s => !session.notifiedSteps.has(s))
        .sort((a, b) => a - b);

    for (const step of newSteps) {
        if (!qaStepReadyToAdvance(content, step)) {
            break;
        }
        // A later Complete row means this is a catch-up after a rewrite, not a real
        // QA-1/2/3 transition. Mark notified and keep looking — do not open QA-2/3/4.
        const laterComplete = [...state.completedSteps].some(s => s > step);
        if (laterComplete) {
            session.notifiedSteps.add(step);
            continue;
        }
        const next = getNextQaStep(step);
        if (!next) {
            session.notifiedSteps.add(step);
            continue;
        }
        if (shouldSkipDuplicateChat(next.command, session.lastOpenedCommand, session.lastOpenedAt, now)) {
            return { action: none, session };
        }
        session.lastOpenedCommand = next.command;
        session.lastOpenedAt = now;
        session.notifiedSteps.add(step);
        return { action: { kind: 'open', command: next.command, label: next.label, step: String(step) }, session };
    }

    return { action: none, session };
}

/** Same-command cooldown so a pendingRecheck cannot open a second copy of the same agent. */
export const SAME_COMMAND_COOLDOWN_MS = 25000;

export function shouldSkipDuplicateChat(
    command: string,
    lastCommand: string | undefined,
    lastOpenedAt: number | undefined,
    now: number,
    cooldownMs = SAME_COMMAND_COOLDOWN_MS
): boolean {
    if (!lastCommand || lastOpenedAt === undefined) {
        return false;
    }
    return command === lastCommand && (now - lastOpenedAt) < cooldownMs;
}

/** Step N Status `✅ Complete` must not open the next agent until the step's summary exists. */
const STEP_SUMMARY_HEADING: Record<string, RegExp> = {
    '2':  /## Step 2 Summary\b/,
    '2F': /## Step 2F Summary\b/,
    '3':  /## Step 3 Summary\b/,
    '3F': /## Step 3F Summary\b/,
    '4':  /## Step 4 Summary\b/,
    '5':  /## Step 5 Summary\b/,
    '6':  /## Step 6 Summary\b/,
    '6F': /## Step 6F Summary\b/,
};

/**
 * True when the completed step has finished writing (summary present).
 * Step 1: ticket id + classified track (empty template is not ready).
 * Steps 7 / 7F: status-only handoff — no brief summary required.
 */
const TRACK_PLACEHOLDER = /\|\s*\*{0,2}Track\*{0,2}\s*\|\s*\*{0,2}\[Backend/;

export function stepReadyToAdvance(content: string, step: string): boolean {
    if (step === '1') {
        const state = parseBrief(content);
        return (
            /^[A-Z][A-Z0-9_-]*-\d+$/i.test(state.ticketId) &&
            state.track !== 'unknown' &&
            !TRACK_PLACEHOLDER.test(content)
        );
    }
    const heading = STEP_SUMMARY_HEADING[step];
    if (!heading) {
        return true;
    }
    return heading.test(content);
}

export function briefNeedsClarification(content: string): boolean {
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (/^[-*]\s*⚠️\s*NEEDS\s*CLARIFICATION\b/i.test(trimmed)) {
            return true;
        }
    }
    return false;
}

export interface SessionState {
    notifiedSteps: Set<string>;
    knownTicketId: string;
    lastNotifiedBlockedLoop: number;
    lastNotifiedCodeFixLoop: number;
    pendingReworkReturn: PendingReworkReturn | null;
    lastOpenedCommand?: string;
    lastOpenedAt?: number;
}

export function createSessionState(partial?: Partial<SessionState>): SessionState {
    return {
        notifiedSteps: new Set(partial?.notifiedSteps ?? []),
        knownTicketId: partial?.knownTicketId ?? '',
        lastNotifiedBlockedLoop: partial?.lastNotifiedBlockedLoop ?? -1,
        lastNotifiedCodeFixLoop: partial?.lastNotifiedCodeFixLoop ?? -1,
        pendingReworkReturn: partial?.pendingReworkReturn ?? null,
        lastOpenedCommand: partial?.lastOpenedCommand,
        lastOpenedAt: partial?.lastOpenedAt,
    };
}

function cloneSession(session: SessionState): SessionState {
    return createSessionState({
        ...session,
        notifiedSteps: new Set(session.notifiedSteps),
        pendingReworkReturn: session.pendingReworkReturn
            ? { ...session.pendingReworkReturn }
            : null,
    });
}

export type BriefActionKind = 'open' | 'clarify' | 'cap' | 'none';

export interface BriefAction {
    kind: BriefActionKind;
    command?: string;
    label?: string;
    /** Completed step that triggered a normal transition, when applicable. */
    step?: string;
}

export interface ProcessBriefResult {
    action: BriefAction;
    session: SessionState;
}

function applySessionReset(session: SessionState, state: BriefState): void {
    if (state.ticketId !== session.knownTicketId) {
        session.notifiedSteps.clear();
        session.knownTicketId = state.ticketId;
        session.lastNotifiedBlockedLoop = -1;
        session.lastNotifiedCodeFixLoop = -1;
        session.pendingReworkReturn = null;
        return;
    }

    const disappeared = [...session.notifiedSteps].filter(s => !state.completedSteps.has(s));
    // Blocked review (even at loops 0) is restaging, not a new ticket. Requiring
    // loops >= 1 here full-reset notifiedSteps and re-opened /backend-implementation.
    const reviewReworkInFlight = blockedReviewStepOf(state) !== null;
    if (disappeared.length > 0 && reviewReworkInFlight) {
        for (const step of disappeared) {
            session.notifiedSteps.delete(step);
        }
    } else if (disappeared.length > 0) {
        session.notifiedSteps.clear();
        session.lastNotifiedBlockedLoop = -1;
        session.lastNotifiedCodeFixLoop = -1;
        session.pendingReworkReturn = null;
    }
    if (state.reworkLoops < session.lastNotifiedBlockedLoop) {
        session.lastNotifiedBlockedLoop = state.reworkLoops;
        session.pendingReworkReturn = null;
    }
    if (state.reworkLoops < session.lastNotifiedCodeFixLoop) {
        session.lastNotifiedCodeFixLoop = state.reworkLoops;
        session.pendingReworkReturn = null;
    }
}

function claimOpen(
    session: SessionState,
    now: number,
    command: string,
    label: string,
    step?: string
): BriefAction {
    if (shouldSkipDuplicateChat(command, session.lastOpenedCommand, session.lastOpenedAt, now)) {
        return { kind: 'none' };
    }
    session.lastOpenedCommand = command;
    session.lastOpenedAt = now;
    return { kind: 'open', command, label, step };
}

/**
 * One file-watcher cycle: parse the brief, update session, decide at most one chat to open.
 * This is the finicky loop that used to open /backend-implementation twice.
 */
export function processBriefChange(
    content: string,
    sessionIn: SessionState,
    options?: { now?: number; reworkCap?: number }
): ProcessBriefResult {
    const now = options?.now ?? Date.now();
    const reworkCap = options?.reworkCap ?? 5;
    const session = cloneSession(sessionIn);
    const state = parseBrief(content);
    const none: BriefAction = { kind: 'none' };

    applySessionReset(session, state);

    const newSteps = [...state.completedSteps]
        .filter(s => !session.notifiedSteps.has(s))
        .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b));

    let fired = false;
    let action: BriefAction = none;

    for (const step of newSteps) {
        const next = getNextStep(step, state.track);
        if (!next) { continue; }

        // Wait for this step's summary. Do not skip ahead to a later completed
        // step. Leaving it out of notifiedSteps lets a later save still fire.
        if (!stepReadyToAdvance(content, step)) {
            break;
        }

        if (step === '1' && briefNeedsClarification(content)) {
            session.notifiedSteps.add(step);
            action = { kind: 'clarify', step: '1' };
            fired = true;
            break;
        }

        action = claimOpen(session, now, next.command, next.label, step);
        if (action.kind === 'open') {
            session.notifiedSteps.add(step);
            fired = true;
        }
        break;
    }

    if (session.pendingReworkReturn) {
        const key = session.pendingReworkReturn.summaryStepKey;
        const currentCount = summaryCountFor(state, key);
        const countIncreased = currentCount > session.pendingReworkReturn.summaryCountAtBlock;

        // A failure write (new summary + Code Fix Required) must not look like a
        // successful rework finish — drop pending so code-fix routing can run.
        if (state.codeFixBlockedSteps.has(key)) {
            session.pendingReworkReturn = null;
        } else if (countIncreased && state.completedSteps.has(key)) {
            const returnTarget: StepTarget = {
                command: session.pendingReworkReturn.returnCommand,
                label: session.pendingReworkReturn.returnLabel,
            };
            // If newSteps already opened this cycle, still chain the next hop.
            // If claimOpen is in cooldown, keep this pending so the same resume retries.
            let openedThisResume = fired;
            if (!fired) {
                action = claimOpen(session, now, returnTarget.command, returnTarget.label);
                openedThisResume = action.kind === 'open';
                fired = openedThisResume;
            }
            if (openedThisResume) {
                session.pendingReworkReturn = nextPendingAfterResume(returnTarget, state);
            }
        }
    }

    const blockedReviewStep = blockedReviewStepOf(state);
    if (
        !fired &&
        shouldFireReviewRework(state, session.lastNotifiedBlockedLoop, session.pendingReworkReturn !== null)
    ) {
        if (state.reworkLoops >= reworkCap) {
            session.lastNotifiedBlockedLoop = state.reworkLoops;
            action = { kind: 'cap' };
            fired = true;
        } else if (blockedReviewStep) {
            const reworkTarget = getReviewReworkAgent(blockedReviewStep, state.reworkKind);
            const resume = getReworkResumeTarget(blockedReviewStep, state.reworkKind);
            action = claimOpen(session, now, reworkTarget.command, reworkTarget.label, blockedReviewStep);
            if (action.kind === 'open') {
                session.lastNotifiedBlockedLoop = state.reworkLoops;
                session.pendingReworkReturn = buildPendingReworkReturn(
                    blockedReviewStep,
                    reworkTarget,
                    resume,
                    state
                );
                fired = true;
            }
        }
    }

    if (
        !fired &&
        shouldFireCodeFixRework(state, session.lastNotifiedCodeFixLoop, session.pendingReworkReturn !== null)
    ) {
        if (state.reworkLoops >= reworkCap) {
            session.lastNotifiedCodeFixLoop = state.reworkLoops;
            action = { kind: 'cap' };
        } else {
            const firstBlockedStep = [...state.codeFixBlockedSteps][0];
            const codeFixTarget = getReviewReworkAgent(firstBlockedStep, 'code');
            const resume = getReworkResumeTarget(firstBlockedStep, 'code');
            action = claimOpen(session, now, codeFixTarget.command, codeFixTarget.label, firstBlockedStep);
            if (action.kind === 'open') {
                session.lastNotifiedCodeFixLoop = state.reworkLoops;
                session.pendingReworkReturn = buildPendingReworkReturn(
                    firstBlockedStep,
                    codeFixTarget,
                    resume,
                    state
                );
            }
        }
    }

    return { action, session };
}

export function buildPendingReworkReturn(
    blockedStep: string,
    reworkAgent: StepTarget,
    resume: StepTarget,
    state: BriefState
): PendingReworkReturn {
    const summaryStepKey = summaryKeyForReworkAgent(reworkAgent.command);
    return {
        blockedStep,
        returnCommand: resume.command,
        returnLabel: resume.label + ' — continue after rework',
        summaryCountAtBlock: summaryCountFor(state, summaryStepKey),
        summaryStepKey,
    };
}

/** If later steps are still marked complete, keep chaining until review re-runs. */
export function nextPendingAfterResume(opened: StepTarget, state: BriefState): PendingReworkReturn | null {
    const chain: Record<string, { next: StepTarget; key: SummaryStepKey; completedStep: string }> = {
        '/unit-test': { next: NEXT_STEP['3'], key: '3', completedStep: '3' },
        '/api-suite': { next: NEXT_STEP['4'], key: '4', completedStep: '4' },
        '/api-execution': { next: NEXT_STEP['5'], key: '5', completedStep: '5' },
        '/frontend-unit-test': { next: NEXT_STEP['3F'], key: '3F', completedStep: '3F' },
    };
    const c = chain[opened.command];
    if (!c || !state.completedSteps.has(c.completedStep)) {
        return null;
    }
    return {
        blockedStep: c.completedStep,
        returnCommand: c.next.command,
        returnLabel: c.next.label + ' — continue after rework',
        summaryCountAtBlock: summaryCountFor(state, c.key),
        summaryStepKey: c.key,
    };
}
