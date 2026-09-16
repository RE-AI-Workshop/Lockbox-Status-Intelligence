/**
 * Project Workflow Router — shared step transition logic.
 * Ported from tools/project-workflow-agent/src/extension.ts
 * Used by the optional CLI watcher and project-workflow-open-next helper.
 * The IDE extension uses extension/src/briefRouting.ts, which is the canonical auto-routing engine.
 */

/** @typedef {{ command: string, label: string }} StepTarget */

/** @typedef {'backend' | 'frontend' | 'full-stack' | 'unknown'} TicketTrack */

/**
 * @typedef {object} BriefState
 * @property {string} ticketId
 * @property {Set<string>} completedSteps
 * @property {Set<string>} blockedSteps
 * @property {Set<string>} codeFixBlockedSteps
 * @property {number} reworkLoops
 * @property {TicketTrack} track
 * @property {'approved' | 'blockers' | 'unknown'} reviewVerdict
 * @property {number} step2SummaryCount
 * @property {number} step2FSummaryCount
 */

/**
 * @typedef {object} PendingReworkReturn
 * @property {string} blockedStep
 * @property {string} returnCommand
 * @property {string} returnLabel
 * @property {number} summaryCountAtBlock
 * @property {'2' | '2F'} summaryStepKey
 */

/**
 * @typedef {object} DevWorkflowState
 * @property {string[]} notifiedSteps
 * @property {string} knownTicketId
 * @property {number} lastNotifiedBlockedLoop
 * @property {number} lastNotifiedCodeFixLoop
 * @property {PendingReworkReturn | null} pendingReworkReturn
 */

/**
 * @typedef {object} QaWorkflowState
 * @property {number[]} notifiedSteps
 */

/**
 * @typedef {object} WorkflowPersistedState
 * @property {DevWorkflowState} dev
 * @property {QaWorkflowState} qa
 * @property {number} [lastProcessedAt]
 */

/**
 * @typedef {object} TransitionResult
 * @property {'none' | 'step_complete' | 'rework_return' | 'review_blocked' | 'code_fix_blocked' | 'loop_cap' | 'workflow_complete'} kind
 * @property {string} [command]
 * @property {string} [label]
 * @property {string} [message]
 * @property {string} [userTitle]
 * @property {DevWorkflowState} [stateUpdates]
 */

const NEXT_STEP = {
  '1': { command: '/backend-implementation', label: 'Backend Implementation (Step 2)' },
  '2': { command: '/unit-test', label: 'Unit Tests (Step 3)' },
  '3': { command: '/api-suite', label: 'API Suite Generation (Step 4)' },
  '4': { command: '/api-execution', label: 'API Suite Execution (Step 5)' },
  '5': { command: '/reviewer', label: 'Backend Review (Step 6)' },
  '6': { command: '/handoff', label: 'Backend Handoff (Step 7)' },
  '2F': { command: '/frontend-unit-test', label: 'Frontend Unit Tests (Step 3F)' },
  '3F': { command: '/frontend-reviewer', label: 'Frontend Review (Step 6F)' },
  '6F': { command: '/frontend-handoff', label: 'Frontend Handoff (Step 7F)' },
};

/** Backend steps re-run after a rework loop (implementation through review). */
const BACKEND_REWORK_PIPELINE = ['2', '3', '4', '5', '6'];

/** Frontend steps re-run after a rework loop. */
const FRONTEND_REWORK_PIPELINE = ['2F', '3F', '6F'];

/**
 * Steps whose `notifiedSteps` entries are cleared so forward routing re-fires after rework.
 * @param {string} blockedStep
 * @returns {string[]}
 */
export function getReworkPipelineSteps(blockedStep) {
  if (['3F', '6F'].includes(blockedStep)) {
    return FRONTEND_REWORK_PIPELINE;
  }
  return BACKEND_REWORK_PIPELINE;
}

/**
 * Human-readable pipeline after rework (for notifications).
 * @param {string} blockedStep
 * @returns {string}
 */
export function getReworkPipelineDescription(blockedStep) {
  if (['6F', '3F'].includes(blockedStep)) {
    return '`/frontend-unit-test` → `/frontend-reviewer`';
  }
  return '`/unit-test` → `/api-suite` → `/api-execution` → `/reviewer`';
}

/**
 * Clear notified steps so each pipeline stage routes again after rework fixes.
 * @param {DevWorkflowState} state
 * @param {string} blockedStep
 */
function prepareReworkPipelineRestart(state, blockedStep) {
  const clearSet = new Set(getReworkPipelineSteps(blockedStep));
  state.notifiedSteps = state.notifiedSteps.filter((s) => !clearSet.has(s));
  state.pendingReworkReturn = null;
}

const QA_NEXT_STEP = {
  1: { command: '/qa-test-generator', label: 'QA Test Generator (QA Step 2)' },
  2: { command: '/qa-smoke-builder', label: 'QA Smoke Builder (QA Step 3)' },
  3: { command: '/qa-report', label: 'QA Report (QA Step 4)' },
};

const STEP_ORDER = ['1', '2', '3', '4', '5', '6', '7', '2F', '3F', '6F', '7F'];

export const DEFAULT_CONFIG = {
  transitionDelayMs: 12000,
  reworkLoopCap: 5,
  debounceMs: 3000,
};

/**
 * @param {string} content
 * @returns {BriefState['reviewVerdict']}
 */
function parseReviewVerdict(content) {
  const reviewSectionRegex = /## Step 6F? Summary [—\-] (?:Backend |Frontend )?Review[\s\S]*?(?=\n##\s|$)/g;
  let match;
  let lastReviewSection = '';

  while ((match = reviewSectionRegex.exec(content)) !== null) {
    lastReviewSection = match[0];
  }

  if (!lastReviewSection) {
    return 'unknown';
  }

  const verdictMatch =
    lastReviewSection.match(/\*\*?Verdict\*\*?:\s*(.+)/i) ??
    lastReviewSection.match(/Verdict:\s*(.+)/i);

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

/**
 * @param {string} content
 * @returns {BriefState}
 */
export function parseBrief(content) {
  const ticketMatch = content.match(/^[-*]\s*Ticket ID:\s*(.+)$/m);
  const ticketId = ticketMatch ? ticketMatch[1].trim() : '';

  const completedSteps = new Set();
  const rowRegex = /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*(?:✅\s*Complete|⏭️?\s*Skipped)/g;
  let m;
  while ((m = rowRegex.exec(content)) !== null) {
    completedSteps.add(m[1]);
  }

  const blockedSteps = new Set();
  const blockedRowRegex = /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*⛔\s*Blocked/g;
  while ((m = blockedRowRegex.exec(content)) !== null) {
    blockedSteps.add(m[1]);
  }

  const codeFixBlockedSteps = new Set();
  const codeFixBlockedRegex =
    /\|\s*(\d+F?)\s*[—\-][^|]*\|\s*⛔\s*Blocked\s*[—\-]\s*Code\s*Fix\s*Required/g;
  while ((m = codeFixBlockedRegex.exec(content)) !== null) {
    codeFixBlockedSteps.add(m[1]);
  }

  const reworkLoopsMatch = content.match(/[-*]\s*Rework loops:\s*(\d+)/);
  const reworkLoops = reworkLoopsMatch ? parseInt(reworkLoopsMatch[1], 10) : 0;

  const step2SummaryCount = (content.match(/## Step 2 Summary/g) || []).length;
  const step2FSummaryCount = (content.match(/## Step 2F Summary/g) || []).length;

  /** @type {TicketTrack} */
  let track = 'unknown';
  if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Full[- ]?Stack\*{0,2}/i.test(content)) {
    track = 'full-stack';
  } else if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Frontend\*{0,2}/i.test(content)) {
    track = 'frontend';
  } else if (/\*{0,2}Track\*{0,2}[:\s|]+\*{0,2}Backend\*{0,2}/i.test(content)) {
    track = 'backend';
  }

  // Match the extension's status-last gate: a status is actionable only after
  // the corresponding summary is on disk. Handoff steps are status-only.
  for (const step of [...completedSteps]) {
    if (step === '1') {
      if (!/^[A-Z][A-Z0-9_-]*-\d+$/i.test(ticketId) || track === 'unknown') {
        completedSteps.delete(step);
      }
      continue;
    }
    if (step === '7' || step === '7F') {
      continue;
    }
    if (!new RegExp(`## Step ${step} Summary\\b`).test(content)) {
      completedSteps.delete(step);
    }
  }

  return {
    ticketId,
    completedSteps,
    blockedSteps,
    codeFixBlockedSteps,
    reworkLoops,
    track,
    reviewVerdict: parseReviewVerdict(content),
    step2SummaryCount,
    step2FSummaryCount,
  };
}

/**
 * @param {string} content
 */
export function parseQaBrief(content) {
  const completedSteps = new Set();
  const rowRegex = /\|\s*QA-(\d)\s*[—\-][^|]*\|\s*(?:✅\s*Complete|⏭️?\s*Skipped)/g;
  let m;
  while ((m = rowRegex.exec(content)) !== null) {
    completedSteps.add(parseInt(m[1], 10));
  }
  for (const step of [...completedSteps]) {
    if (!new RegExp(`## QA Step ${step} Summary\\b`).test(content)) {
      completedSteps.delete(step);
    }
  }
  return { completedSteps };
}

/**
 * @param {string} completedStep
 * @param {TicketTrack} track
 * @param {BriefState['reviewVerdict']} reviewVerdict
 * @returns {StepTarget | null}
 */
export function getNextStep(completedStep, track, reviewVerdict) {
  if (completedStep === '1') {
    if (track === 'frontend') {
      return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F)' };
    }
    return NEXT_STEP['1'];
  }

  if (completedStep === '6' && reviewVerdict === 'blockers') {
    return {
      command: '/backend-implementation',
      label: 'Backend Implementation (Step 2) — Rework Loop from Review Blockers',
    };
  }

  if (completedStep === '7') {
    if (track === 'full-stack') {
      return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F) — Full-Stack' };
    }
    return null;
  }

  if (completedStep === '6F' && reviewVerdict === 'blockers') {
    return {
      command: '/frontend-implementation',
      label: 'Frontend Implementation (Step 2F) — Rework Loop from Review Blockers',
    };
  }

  if (completedStep === '7F') {
    return null;
  }

  return NEXT_STEP[completedStep] ?? null;
}

/**
 * @param {string} blockedStep
 * @returns {StepTarget}
 */
export function getReworkTarget(blockedStep) {
  if (['3F', '6F'].includes(blockedStep)) {
    return { command: '/frontend-implementation', label: 'Frontend Implementation (Step 2F) — Rework' };
  }
  return { command: '/backend-implementation', label: 'Backend Implementation (Step 2) — Rework' };
}

/**
 * @param {number} completedStep
 * @returns {StepTarget | null}
 */
export function getNextQaStep(completedStep) {
  if (completedStep === 4) {
    return null;
  }
  return QA_NEXT_STEP[completedStep] ?? null;
}

/**
 * @returns {DevWorkflowState}
 */
export function createEmptyDevState() {
  return {
    notifiedSteps: [],
    knownTicketId: '',
    lastNotifiedBlockedLoop: -1,
    lastNotifiedCodeFixLoop: -1,
    pendingReworkReturn: null,
  };
}

/**
 * @returns {QaWorkflowState}
 */
export function createEmptyQaState() {
  return { notifiedSteps: [] };
}

/**
 * Pre-seed notified steps from brief on first run (mirrors extension activation).
 * @param {BriefState} briefState
 * @param {DevWorkflowState} devState
 */
export function seedDevStateFromBrief(briefState, devState) {
  if (devState.notifiedSteps.length > 0) {
    return devState;
  }
  if (
    briefState.ticketId &&
    (devState.knownTicketId === '' || devState.knownTicketId === briefState.ticketId)
  ) {
    return {
      ...devState,
      notifiedSteps: [...briefState.completedSteps],
      knownTicketId: briefState.ticketId,
    };
  }
  return devState;
}

/**
 * @param {BriefState} briefState
 * @param {DevWorkflowState} devState
 * @param {{ reworkLoopCap?: number }} config
 * @returns {{ result: TransitionResult, state: DevWorkflowState }}
 */
export function evaluateDevBrief(briefState, devState, config = {}) {
  const reworkLoopCap = config.reworkLoopCap ?? DEFAULT_CONFIG.reworkLoopCap;
  /** @type {DevWorkflowState} */
  let state = { ...devState, notifiedSteps: [...devState.notifiedSteps] };

  const stateRolledBack = state.notifiedSteps.some((s) => !briefState.completedSteps.has(s));
  if (stateRolledBack || briefState.ticketId !== state.knownTicketId) {
    state = createEmptyDevState();
    state.knownTicketId = briefState.ticketId;
  }

  const notifiedSet = new Set(state.notifiedSteps);

  const newSteps = [...briefState.completedSteps]
    .filter((s) => !notifiedSet.has(s))
    .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b));

  for (const step of newSteps) {
    const next = getNextStep(step, briefState.track, briefState.reviewVerdict);
    if (!next) {
      continue;
    }

    state.notifiedSteps = [...new Set([...state.notifiedSteps, step])];
    return {
      result: {
        kind: 'step_complete',
        command: next.command,
        label: next.label,
        message: `Step ${step} complete. Start a new Agent chat with \`${next.command}\`.`,
        userTitle: `Project Workflow — Step ${step} complete`,
      },
      state,
    };
  }

  const blockedReviewStep = briefState.blockedSteps.has('6')
    ? '6'
    : briefState.blockedSteps.has('6F')
      ? '6F'
      : null;

  if (
    blockedReviewStep &&
    briefState.reviewVerdict === 'blockers' &&
    briefState.reworkLoops > state.lastNotifiedBlockedLoop
  ) {
    if (briefState.reworkLoops >= reworkLoopCap) {
      return {
        result: {
          kind: 'loop_cap',
          message: `Rework loop cap reached (${briefState.reworkLoops} of ${reworkLoopCap}). Manual investigation required. Run \`node scripts/project-workflow-open-next.mjs\` after resolving.`,
          userTitle: 'Project Workflow — Loop cap reached',
        },
        state,
      };
    }

    const reworkTarget = getReworkTarget(blockedReviewStep);
    const pipelineDesc = getReworkPipelineDescription(blockedReviewStep);

    state.lastNotifiedBlockedLoop = briefState.reworkLoops;
    prepareReworkPipelineRestart(state, blockedReviewStep);

    return {
      result: {
        kind: 'review_blocked',
        command: reworkTarget.command,
        label: reworkTarget.label,
        message:
          `Step ${blockedReviewStep} blocked (rework loop ${briefState.reworkLoops} of ${reworkLoopCap - 1}). ` +
          `Start a new Agent chat with \`${reworkTarget.command}\`. ` +
          `After the fix, re-run the full pipeline: ${pipelineDesc} (reset downstream step statuses in the brief before marking Step 2/2F complete).`,
        userTitle: `Project Workflow — Step ${blockedReviewStep} blocked`,
      },
      state,
    };
  }

  if (
    briefState.codeFixBlockedSteps.size > 0 &&
    briefState.reworkLoops > state.lastNotifiedCodeFixLoop
  ) {
    if (briefState.reworkLoops >= reworkLoopCap) {
      const blockedStepNames = [...briefState.codeFixBlockedSteps].join(', ');
      return {
        result: {
          kind: 'loop_cap',
          message: `Rework loop cap reached on step(s) ${blockedStepNames}. Manual investigation required.`,
          userTitle: 'Project Workflow — Loop cap reached',
        },
        state,
      };
    }

    const firstBlockedStep = [...briefState.codeFixBlockedSteps][0];
    const codeFixTarget = getReworkTarget(firstBlockedStep);
    const pipelineDesc = getReworkPipelineDescription(firstBlockedStep);

    state.lastNotifiedCodeFixLoop = briefState.reworkLoops;
    prepareReworkPipelineRestart(state, firstBlockedStep);

    const blockedStepNames = [...briefState.codeFixBlockedSteps].join(', ');
    return {
      result: {
        kind: 'code_fix_blocked',
        command: codeFixTarget.command,
        label: codeFixTarget.label,
        message:
          `Step ${blockedStepNames} blocked — code fix required. ` +
          `Start a new Agent chat with \`${codeFixTarget.command}\`. ` +
          `After the fix, re-run the full pipeline: ${pipelineDesc} (reset downstream step statuses in the brief before marking Step 2/2F complete).`,
        userTitle: `Project Workflow — Code fix required`,
      },
      state,
    };
  }

  return { result: { kind: 'none' }, state };
}

/**
 * Manual "open next step" — mirrors extension command projectWorkflow.openNextStep.
 * @param {BriefState} briefState
 * @param {{ reworkLoopCap?: number }} config
 * @returns {TransitionResult}
 */
export function resolveManualDevNext(briefState, config = {}) {
  const reworkLoopCap = config.reworkLoopCap ?? DEFAULT_CONFIG.reworkLoopCap;

  if (briefState.codeFixBlockedSteps.size > 0) {
    if (briefState.reworkLoops >= reworkLoopCap) {
      return {
        kind: 'loop_cap',
        message: `Rework loop cap reached. Investigate manually before continuing.`,
        userTitle: 'Project Workflow — Loop cap reached',
      };
    }
    const firstBlockedStep = [...briefState.codeFixBlockedSteps][0];
    const target = getReworkTarget(firstBlockedStep);
    return {
      kind: 'code_fix_blocked',
      command: target.command,
      label: target.label,
      message: `Start a new Agent chat with \`${target.command}\`.`,
      userTitle: 'Project Workflow — Open next step',
    };
  }

  const blockedReviewStep = briefState.blockedSteps.has('6')
    ? '6'
    : briefState.blockedSteps.has('6F')
      ? '6F'
      : null;

  if (blockedReviewStep && briefState.reviewVerdict === 'blockers') {
    if (briefState.reworkLoops >= reworkLoopCap) {
      return {
        kind: 'loop_cap',
        message: `Rework loop cap reached on step ${blockedReviewStep}.`,
        userTitle: 'Project Workflow — Loop cap reached',
      };
    }
    const target = getReworkTarget(blockedReviewStep);
    return {
      kind: 'review_blocked',
      command: target.command,
      label: target.label,
      message: `Start a new Agent chat with \`${target.command}\`.`,
      userTitle: 'Project Workflow — Open next step',
    };
  }

  const completedInOrder = STEP_ORDER.filter((s) => briefState.completedSteps.has(s));
  const lastCompleted = completedInOrder.length > 0 ? completedInOrder[completedInOrder.length - 1] : '0';
  const next = getNextStep(lastCompleted, briefState.track, briefState.reviewVerdict);

  if (next) {
    return {
      kind: 'step_complete',
      command: next.command,
      label: next.label,
      message: `Start a new Agent chat with \`${next.command}\`.`,
      userTitle: 'Project Workflow — Open next step',
    };
  }

  if (lastCompleted === '7F' || (lastCompleted === '7' && briefState.track !== 'full-stack')) {
    return {
      kind: 'workflow_complete',
      message: 'All dev workflow steps complete for this ticket.',
      userTitle: 'Project Workflow — Complete',
    };
  }

  return {
    kind: 'none',
    message: 'No completed steps found in brief. Run `/intake-agent` first.',
    userTitle: 'Project Workflow',
  };
}

/**
 * @param {ReturnType<typeof parseQaBrief>} qaBriefState
 * @param {QaWorkflowState} qaState
 * @returns {{ result: TransitionResult, state: QaWorkflowState }}
 */
export function evaluateQaBrief(qaBriefState, qaState) {
  /** @type {QaWorkflowState} */
  let state = { notifiedSteps: [...qaState.notifiedSteps] };
  const notifiedSet = new Set(state.notifiedSteps);

  const stateRolledBack = state.notifiedSteps.some((s) => !qaBriefState.completedSteps.has(s));
  if (stateRolledBack) {
    state = createEmptyQaState();
  }

  const newSteps = [...qaBriefState.completedSteps]
    .filter((s) => !notifiedSet.has(s))
    .sort((a, b) => a - b);

  for (const step of newSteps) {
    const next = getNextQaStep(step);
    if (!next) {
      continue;
    }
    state.notifiedSteps = [...new Set([...state.notifiedSteps, step])];
    return {
      result: {
        kind: 'step_complete',
        command: next.command,
        label: next.label,
        message: `QA Step ${step} complete. Start a new Agent chat with \`${next.command}\`.`,
        userTitle: `Project Workflow — QA Step ${step} complete`,
      },
      state,
    };
  }

  return { result: { kind: 'none' }, state };
}

/**
 * @param {ReturnType<typeof parseQaBrief>} qaBriefState
 * @returns {TransitionResult}
 */
export function resolveManualQaNext(qaBriefState) {
  const lastCompleted =
    qaBriefState.completedSteps.size > 0 ? Math.max(...qaBriefState.completedSteps) : 0;
  const next = getNextQaStep(lastCompleted);

  if (next) {
    return {
      kind: 'step_complete',
      command: next.command,
      label: next.label,
      message: `Start a new Agent chat with \`${next.command}\`.`,
      userTitle: 'Project Workflow — Open next QA step',
    };
  }

  if (lastCompleted === 4) {
    return {
      kind: 'workflow_complete',
      message: 'All QA workflow steps complete.',
      userTitle: 'Project Workflow — QA complete',
    };
  }

  return {
    kind: 'none',
    message: 'No completed QA steps found. Run `/qa-intake` first.',
    userTitle: 'Project Workflow',
  };
}
