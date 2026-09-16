import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
    type PendingReworkReturn,
    STEP_ORDER,
    blockedReviewStepOf,
    briefNeedsClarification,
    getNextQaStep,
    getNextStep,
    getReviewReworkAgent,
    parseBrief,
    parseQaBrief,
    processBriefChange,
    processQaBriefChange,
    qaStepReadyToAdvance,
    shouldSkipDuplicateChat,
    stepReadyToAdvance,
} from './briefRouting';
import { CURSOR_CREATE_AGENT_ARGS, planCursorLaunch } from './promptLaunch';

const execFileAsync = promisify(execFile);

const AUTO_KEEP_CANDIDATES = [
    'workbench.action.chat.applyAllEdits',
    'workbench.action.chat.applyEdits',
    'workbench.action.chat.apply',
    'workbench.action.chat.keepAll',
    'workbench.action.chat.keep',
    'github.copilot.chat.applyCopilotCLIAgentSessionChanges.apply',
    'github.copilot.chat.applyCopilotCLIAgentSessionChanges',
    'github.copilot.chat.copilotCLI.acceptDiff',
];

// ── Chat opener ────────────────────────────────────────────────────────────────

/** Set during activate — Cursor exposes composer.* commands; VS Code Copilot does not. */
let isCursorIde = false;
/** Workspace root for the project being driven (the folder that contains `.github/ai`). */
let projectRoot = '';

const SUBMIT_COMMAND_CANDIDATES = [
    'composer.startGeneration',
    'workbench.action.chat.submit',
    'workbench.action.chat.submitChat',
    'workbench.action.chat.send',
    'workbench.action.chat.sendRequest',
    'cursor.startComposerPrompt',
    'aichat.submit',
    'composer.submit',
];

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryExecuteCommand(command: string, ...args: unknown[]): Promise<boolean> {
    try {
        await vscode.commands.executeCommand(command, ...args);
        return true;
    } catch {
        return false;
    }
}

async function discoverSubmitCommands(): Promise<string[]> {
    const allCommands = await vscode.commands.getCommands(true);
    const commandSet = new Set(allCommands);

    const known = SUBMIT_COMMAND_CANDIDATES.filter(c => commandSet.has(c));
    const discovered = allCommands.filter(c => {
        const lower = c.toLowerCase();
        const isChatLike = lower.includes('composer') || lower.includes('chat') || lower.includes('aichat');
        const isSubmitLike = /submit|send|generation|generate/.test(lower);
        return isChatLike && isSubmitLike;
    });

    const ordered: string[] = [];
    for (const c of [...known, ...discovered]) {
        if (!ordered.includes(c)) {
            ordered.push(c);
        }
    }
    return ordered;
}

/**
 * Always create a new composer in Agent. Do not use chat.open (inherits last
 * mode) and do not lead with newAgentChat (hide-if-empty-Agent / Glass).
 * Do not call composer.startComposerPrompt2 / composerMode.agent after the
 * chip binds — those run openComposer with insertSelection and can attach
 * the current editor selection, or hide the pane if it is already Agent.
 */
async function openEmptyCursorAgentChat(): Promise<boolean> {
    if (await tryExecuteCommand('composer.createNew', CURSOR_CREATE_AGENT_ARGS)) {
        return true;
    }
    return tryExecuteCommand('composer.newAgentChat');
}

/** Focus the current agent composer — commands that do NOT open a new chat tab. */
async function focusAgentComposer(): Promise<void> {
    const focusOnly = [
        'composer.focusComposer',
        'workbench.action.chat.focusInput',
        'aichat.focusInput',
    ];
    for (const cmd of focusOnly) {
        await tryExecuteCommand(cmd);
        await delay(100);
    }
}

/** Guard against duplicate tab creation from rapid/re-entrant openNewAgentChat calls. */
let chatOpenInProgress = false;
let lastOpenedCommand: string | undefined;
let lastOpenedAt = 0;

/**
 * Cursor's workbench.action.chat.open copies `query` into composer text/richText
 * as a plain string. It ignores mode / isPartialQuery / attachFiles, and a new
 * chat inherits the last mode (often Plan). composer.newAgentChat can hide an
 * already-focused empty Agent pane, or on Glass skip mode entirely.
 * composer.createNew({ unifiedMode: "agent" }) is the command that actually
 * creates with Agent. Selecting `/reviewer` from the slash picker inserts a
 * command chip (`insertCommand`). Open an empty Agent chat, type the slash so
 * the picker binds that chip, then submit. If the chat never opens, do not
 * Cmd+Enter.
 */
async function openCursorAgentWithPrompt(command: string): Promise<void> {
    const plan = planCursorLaunch(projectRoot || undefined, command);

    const opened = await openEmptyCursorAgentChat();

    if (!opened) {
        vscode.window.showWarningMessage(
            `Project Workflow: could not open an Agent chat for \`${plan.slash}\`. ` +
            'Run "Project Workflow: Open Next Step" after the chat panel is ready.'
        );
        return;
    }

    await delay(1000);
    await activateCursorWindow(400);
    await focusAgentComposer();
    await delay(250);

    if (!(await typeSlashAndAcceptPicker(plan.slash))) {
        vscode.window.showWarningMessage(
            `Project Workflow: type \`${plan.slash}\` in Agent chat, select it from the picker, then submit.`
        );
        return;
    }

    await delay(350);

    if (plan.extra) {
        await vscode.env.clipboard.writeText(` ${plan.extra}`);
        await tryExecuteCommand('editor.action.clipboardPasteAction');
        await delay(150);
    }

    const preferCmdEnter = getCursorSubmitUsesCmdEnter();
    if (await submitCursorAgentChat(preferCmdEnter)) {
        return;
    }

    vscode.window.showWarningMessage(
        `Project Workflow: could not auto-submit \`${plan.slash}\`. ` +
        'Select it from the `/` picker if it is still plain text, then press ' +
        (preferCmdEnter ? '⌘+Enter' : 'Enter') + '.'
    );
}

/**
 * Type `/` (opens the picker), then the command name, then Enter to select the row.
 * Do not use acceptSelectedSuggestion — that is the editor widget and returns
 * success even when the slash menu is still open, after which Cmd+Enter submits
 * `/reviewer` as plain text. Do not press Escape (dismisses the picker).
 */
async function typeSlashAndAcceptPicker(slash: string): Promise<boolean> {
    const name = slash.startsWith('/') ? slash.slice(1) : slash;
    if (process.platform !== 'darwin') {
        await vscode.env.clipboard.writeText(`/${name}`);
        return tryExecuteCommand('editor.action.clipboardPasteAction');
    }
    const escaped = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    try {
        await execFileAsync('osascript', ['-e', `
            tell application "System Events"
                tell process "Cursor"
                    set frontmost to true
                    delay 0.1
                    keystroke "/"
                    delay 0.35
                    keystroke "${escaped}"
                    delay 0.4
                    key code 36
                end tell
            end tell
        `]);
        return true;
    } catch {
        return false;
    }
}

async function submitCursorAgentChat(preferCmdEnter: boolean): Promise<boolean> {
    const retries = vscode.workspace.getConfiguration('projectWorkflow').get<number>('cursorSubmitRetries', 3);

    for (let attempt = 0; attempt < retries; attempt++) {
        await activateCursorWindow(350 + attempt * 150);
        await focusAgentComposer();
        await delay(250);

        if (process.platform === 'darwin') {
            await sendMacChatSubmit(preferCmdEnter);
        } else if (await tryExecuteCommand('workbench.action.chat.submit')) {
            return true;
        }

        if (attempt < retries - 1) {
            await delay(400);
        }
    }

    // Keyboard may have missed when another app (e.g. Teams) had focus — try in-process submit.
    await activateCursorWindow(300);
    await focusAgentComposer();
    await delay(200);
    return trySubmitViaCommandsOnly();
}

/** Bring Cursor to the foreground before keyboard submit (avoids ⌘+Enter going to Teams/Slack). */
async function activateCursorWindow(settleMs: number): Promise<void> {
    if (process.platform !== 'darwin') {
        return;
    }
    try {
        await execFileAsync('osascript', ['-e', `
            tell application "Cursor" to activate
            delay ${settleMs / 1000}
            tell application "System Events" to tell process "Cursor" to set frontmost to true
        `]);
    } catch {
        /* Accessibility permission may be missing — VS Code focus commands still run */
    }
}

/** Press chat submit keys in Cursor. Default Cursor setting uses ⌘+Enter (plain Enter = newline). */
async function sendMacChatSubmit(preferCmdEnter: boolean): Promise<void> {
    if (process.platform !== 'darwin') {
        return;
    }

    const modifier = preferCmdEnter ? ' using command down' : '';
    try {
        // Target process "Cursor" so the keystroke does not land in Teams/another frontmost app.
        await execFileAsync('osascript', ['-e', `
            tell application "System Events"
                tell process "Cursor"
                    set frontmost to true
                    delay 0.15
                    key code 36${modifier}
                end tell
            end tell
        `]);
    } catch {
        /* optional */
    }
}

async function focusChatInput(): Promise<void> {
    await focusAgentComposer();
}

async function trySubmitViaCommandsOnly(): Promise<boolean> {
    await focusChatInput();
    for (const cmd of await discoverSubmitCommands()) {
        // startGeneration can open a 2nd agent tab; chat.submit is safe after chat.open filled input.
        if (cmd === 'composer.startGeneration') {
            continue;
        }
        if (await tryExecuteCommand(cmd)) {
            return true;
        }
    }
    return false;
}

function getCursorSubmitUsesCmdEnter(): boolean {
    return vscode.workspace.getConfiguration('projectWorkflow').get<boolean>('cursorSubmitWithCmdEnter', true);
}

/**
 * Open a fresh Agent chat and submit the next step.
 * Cursor: empty Agent chat → type `/name` → accept picker chip → submit.
 * VS Code Copilot: workbench.action.chat.newChat → workbench.action.chat.open with `/command`.
 */
async function openNewAgentChat(command: string, force = false): Promise<void> {
    const now = Date.now();
    if (!force && shouldSkipDuplicateChat(command, lastOpenedCommand, lastOpenedAt, now)) {
        return;
    }
    if (chatOpenInProgress) {
        return;
    }
    chatOpenInProgress = true;
    lastOpenedCommand = command;
    lastOpenedAt = now;

    try {
        if (isCursorIde) {
            await openCursorAgentWithPrompt(command);
            return;
        }

        await vscode.env.clipboard.writeText(command);

        if (await tryExecuteCommand('workbench.action.chat.newChat')) {
            await delay(600);
        }

        if (await tryExecuteCommand('workbench.action.chat.open', {
            query: command,
            mode: 'agent',
            isPartialQuery: false,
        })) {
            return;
        }

        if (await tryExecuteCommand('editor.action.clipboardPasteAction')) {
            await delay(200);
            if (await trySubmitViaCommandsOnly()) {
                return;
            }
        }

        try {
            await vscode.commands.executeCommand('workbench.action.chat.open');
        } catch { /* panel already open */ }

        vscode.window.showInformationMessage(
            `Project Workflow: ${command} is ready — press Enter in the Agent chat to submit.`
        );
    } finally {
        chatOpenInProgress = false;
    }
}

async function promptTicketId(kind: 'dev' | 'qa'): Promise<string | undefined> {
    const ticketId = await vscode.window.showInputBox({
        title: kind === 'dev' ? 'Project Workflow — Start Dev Ticket' : 'Project Workflow — Start QA Ticket',
        prompt: 'Enter Jira ticket ID',
        placeHolder: vscode.workspace.getConfiguration('projectWorkflow').get<string>('ticketIdExample', 'DEMO-123'),
        validateInput: (value) => {
            const trimmed = value.trim();
            const configured = vscode.workspace.getConfiguration('projectWorkflow').get<string>(
                'ticketIdPattern',
                '^[A-Z][A-Z0-9_-]*-[0-9]+$'
            );
            try {
                if (!new RegExp(configured, 'i').test(trimmed)) {
                    return `Ticket ID does not match configured pattern: ${configured}`;
                }
            } catch {
                return 'projectWorkflow.ticketIdPattern is not a valid regular expression';
            }
            return undefined;
        },
    });
    return ticketId?.trim().toUpperCase();
}

async function showStepTransitionNotification(message: string, timeoutMs = 30000): Promise<void> {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Project Workflow',
            cancellable: true,
        },
        async (progress, token) => {
            progress.report({ message });

            await new Promise<void>(resolve => {
                const timer = setTimeout(resolve, timeoutMs);
                token.onCancellationRequested(() => {
                    clearTimeout(timer);
                    resolve();
                });
            });
        }
    );
}

function isRunningInCursor(): boolean {
    return isCursorIde || vscode.env.appName.toLowerCase().includes('cursor');
}

function getAutoKeepEnabled(): boolean {
    if (isRunningInCursor()) {
        return false;
    }
    return vscode.workspace.getConfiguration('projectWorkflow').get<boolean>('autoKeepAgentEdits', false);
}

function getTransitionDelayMs(): number {
    const configured = vscode.workspace.getConfiguration('projectWorkflow').get<number>('transitionDelayMs', 12000);
    if (typeof configured !== 'number' || Number.isNaN(configured)) {
        return 12000;
    }
    return Math.max(0, configured);
}

function getReworkLoopCap(): number {
    const configured = vscode.workspace.getConfiguration('projectWorkflow').get<number>('reworkLoopCap', 5);
    if (typeof configured !== 'number' || Number.isNaN(configured) || configured < 1) {
        return 5;
    }
    return configured;
}

async function findApplicableAutoKeepCommands(): Promise<string[]> {
    const allCommands = await vscode.commands.getCommands(true);
    const commandSet = new Set(allCommands);

    const known = AUTO_KEEP_CANDIDATES.filter(c => commandSet.has(c));
    const discovered = allCommands.filter(c => {
        const lower = c.toLowerCase();
        const isChatOrCopilot = lower.includes('chat') || lower.includes('copilot');
        const isApplyLike = /apply|accept|keep/.test(lower);
        const isEditLike = /edit|edits|change|changes|diff|session/.test(lower);
        return isChatOrCopilot && isApplyLike && isEditLike;
    });

    const ordered = [...known];
    for (const c of discovered) {
        if (!ordered.includes(c)) {
            ordered.push(c);
        }
    }

    return ordered;
}

async function tryAutoKeepOnce(commands: string[]): Promise<boolean> {
    let executed = false;
    for (const command of commands) {
        try {
            await vscode.commands.executeCommand(command);
            executed = true;
        } catch {
            // Command exists but is not currently applicable; try the next candidate.
        }
    }
    return executed;
}

async function scheduleAutoKeepLoop(): Promise<void> {
    if (isRunningInCursor() || !getAutoKeepEnabled()) {
        return;
    }

    const commands = await findApplicableAutoKeepCommands();
    if (commands.length === 0) {
        return;
    }

    // Keep trying for a short window while the agent is likely producing edits.
    // Applying when nothing is pending is a harmless no-op for these commands.
    const maxAttempts = 60; // ~5 minutes at 5s interval
    const intervalMs = 5000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await tryAutoKeepOnce(commands);
        await new Promise<void>(resolve => setTimeout(resolve, intervalMs));
    }
}

// ── Extension state ────────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const availableCommands = await vscode.commands.getCommands(true);
    isCursorIde =
        vscode.env.appName.toLowerCase().includes('cursor') ||
        availableCommands.includes('composer.newAgentChat');

    // Find the workspace folder that contains the AI workflow directory.
    const projectFolder = vscode.workspace.workspaceFolders?.find(f =>
        fs.existsSync(path.join(f.uri.fsPath, '.github', 'ai'))
    );

    if (!projectFolder) { return; }
    projectRoot = projectFolder.uri.fsPath;

    const briefPath = path.join(projectFolder.uri.fsPath, '.github', 'ai', 'active-brief.md');

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.command = 'projectWorkflow.startDevTicket';
    context.subscriptions.push(statusBar);

    function updateStatusBar(content?: string): void {
        try {
            const briefContent = content ?? (fs.existsSync(briefPath) ? fs.readFileSync(briefPath, 'utf-8') : '');
            if (!briefContent) {
                statusBar.text = '$(play) Project Workflow';
                statusBar.tooltip = 'Project Workflow — Cmd+Shift+P → "Project Workflow: Start Dev Ticket"';
                statusBar.show();
                return;
            }
            const state = parseBrief(briefContent);
            const completedInOrder = STEP_ORDER.filter(s => state.completedSteps.has(s));
            const lastCompleted = completedInOrder.length > 0 ? completedInOrder[completedInOrder.length - 1] : '—';
            const ticket = state.ticketId || 'ticket';
            if (briefNeedsClarification(briefContent)) {
                statusBar.text = `$(warning) Workflow: ${ticket} — needs clarification`;
                statusBar.tooltip = 'Resolve ⚠️ NEEDS CLARIFICATION in active-brief.md, then Open Next Step';
            } else {
                statusBar.text = `$(sync) Workflow: ${ticket} · Step ${lastCompleted}`;
                statusBar.tooltip = 'Project Workflow — watching active-brief.md for step transitions';
            }
            statusBar.show();
        } catch {
            statusBar.text = '$(play) Project Workflow';
            statusBar.show();
        }
    }

    updateStatusBar();

    // Per-session state: which steps have already triggered a notification.
    // Stored in workspaceState so it survives VS Code restarts within the same ticket.
    // String keys to support "2F", "3F", "6F", "7F" frontend steps.
    let notifiedSteps = new Set<string>(
        context.workspaceState.get<string[]>('projectWorkflow.notifiedSteps', [])
    );
    let knownTicketId: string = context.workspaceState.get<string>('projectWorkflow.ticketId', '');
    // Tracks which rework loop index we last fired a "step 6 blocked" notification for.
    let lastNotifiedBlockedLoop: number = context.workspaceState.get<number>('projectWorkflow.lastNotifiedBlockedLoop', -1);
    // Tracks which rework loop index we last fired a "code fix required" notification for.
    let lastNotifiedCodeFixLoop: number = context.workspaceState.get<number>('projectWorkflow.lastNotifiedCodeFixLoop', -1);
    // Pending rework return: after blocked handler fires implementation, this records
    // where to route once the implementation agent finishes (detected by summary count increase).
    let pendingReworkReturn: PendingReworkReturn | null =
        context.workspaceState.get<PendingReworkReturn | null>('projectWorkflow.pendingReworkReturn', null);

    function persistState(): void {
        context.workspaceState.update('projectWorkflow.notifiedSteps', [...notifiedSteps]);
        context.workspaceState.update('projectWorkflow.ticketId', knownTicketId);
        context.workspaceState.update('projectWorkflow.lastNotifiedBlockedLoop', lastNotifiedBlockedLoop);
        context.workspaceState.update('projectWorkflow.lastNotifiedCodeFixLoop', lastNotifiedCodeFixLoop);
        context.workspaceState.update('projectWorkflow.pendingReworkReturn', pendingReworkReturn);
    }

    // State migration: if stored notifiedSteps contains numeric values from the old
    // extension version, discard and reset to empty set.
    const storedNotified = context.workspaceState.get<(string | number)[]>('projectWorkflow.notifiedSteps', []);
    if (storedNotified.some(v => typeof v === 'number')) {
        notifiedSteps.clear();
        persistState();
    }

    // On activation, pre-seed notifiedSteps from the current brief so that a
    // VS Code reload or extension reinstall (which clears workspaceState) does not
    // cause already-completed steps to re-fire notifications.  Without this, an
    // empty notifiedSteps makes every completed step look "new", and the loop fires
    // for step 1 first (→ /backend-implementation) instead of the actual next step.
    if (notifiedSteps.size === 0 && fs.existsSync(briefPath)) {
        try {
            const initialContent = fs.readFileSync(briefPath, 'utf-8');
            const initialState = parseBrief(initialContent);
            // Only pre-seed when the stored ticketId matches (or is unset) so we
            // don't accidentally suppress the first notification for a brand-new ticket.
            if (initialState.ticketId && (knownTicketId === '' || knownTicketId === initialState.ticketId)) {
                for (const step of initialState.completedSteps) {
                    notifiedSteps.add(step);
                }
                knownTicketId = initialState.ticketId;
                persistState();
            }
        } catch { /* brief unreadable — ignore */ }
    }

    // Debounce so rapid successive saves don't fire multiple notifications.
    // 3 s gives the agent time to finish all file edits (summary + ✅ marker)
    // before we inspect the brief.
    let debounceTimer: NodeJS.Timeout | undefined;
    // Guard against concurrent executions: the long notification delay means a new
    // debounce timer can fire while the previous async invocation is still running.
    let isProcessing = false;
    // Track whether a brief change arrived while we were processing, so we can
    // re-check after the current cycle finishes (prevents missed step transitions
    // when an agent completes quickly, e.g. skip scenarios).
    let pendingRecheck = false;
    let lastBriefUri: vscode.Uri | undefined;

    async function onBriefChanged(uri: vscode.Uri): Promise<void> {
        lastBriefUri = uri;
        if (debounceTimer) { clearTimeout(debounceTimer); }
        debounceTimer = setTimeout(async () => {
            // Reset so subsequent saves start a fresh debounce, not a clearTimeout no-op.
            debounceTimer = undefined;

            // Skip if a previous invocation is still in its notification delay.
            // Mark that a recheck is needed so we don't miss this change.
            if (isProcessing) {
                pendingRecheck = true;
                return;
            }
            isProcessing = true;

            try {
                const content = fs.readFileSync(uri.fsPath, 'utf-8');
                const result = processBriefChange(content, {
                    notifiedSteps,
                    knownTicketId,
                    lastNotifiedBlockedLoop,
                    lastNotifiedCodeFixLoop,
                    pendingReworkReturn,
                    lastOpenedCommand,
                    lastOpenedAt,
                }, { now: Date.now(), reworkCap: getReworkLoopCap() });

                notifiedSteps = result.session.notifiedSteps;
                knownTicketId = result.session.knownTicketId;
                lastNotifiedBlockedLoop = result.session.lastNotifiedBlockedLoop;
                lastNotifiedCodeFixLoop = result.session.lastNotifiedCodeFixLoop;
                pendingReworkReturn = result.session.pendingReworkReturn;
                lastOpenedCommand = result.session.lastOpenedCommand;
                lastOpenedAt = result.session.lastOpenedAt ?? 0;
                persistState();
                updateStatusBar(content);

                const action = result.action;
                if (action.kind === 'clarify') {
                    await vscode.window.showInformationMessage(
                        'Project Workflow: Step 1 complete — brief has ⚠️ NEEDS CLARIFICATION. ' +
                        'Resolve in active-brief.md, then run "Project Workflow: Open Next Step".',
                        'Open Next Step'
                    ).then(choice => {
                        if (choice === 'Open Next Step') {
                            void vscode.commands.executeCommand('projectWorkflow.openNextStep');
                        }
                    });
                } else if (action.kind === 'cap') {
                    const state = parseBrief(content);
                    await vscode.window.showErrorMessage(
                        `Project Workflow: rework loop cap reached (${state.reworkLoops} of ${getReworkLoopCap()} allowed). ` +
                        `Automatic routing has stopped. Investigate the root cause manually, then use ` +
                        `"Project Workflow: Open Next Step" to resume once the issue is resolved.`,
                        { modal: true },
                        'Dismiss'
                    );
                } else if (action.kind === 'open' && action.command && action.label) {
                    const transitionDelayMs = getTransitionDelayMs();
                    const waitPrefix = action.step
                        ? `Step ${action.step} complete`
                        : 'Rework';
                    if (transitionDelayMs > 0) {
                        await showStepTransitionNotification(
                            `${waitPrefix}. Waiting ${Math.round(transitionDelayMs / 1000)}s before starting ${action.label}…`,
                            transitionDelayMs
                        );
                    }
                    void showStepTransitionNotification(
                        `${waitPrefix}. Starting ${action.label}…`
                    );
                    await openNewAgentChat(action.command, true);
                    void scheduleAutoKeepLoop();
                }
            } catch {
                // Brief doesn't exist yet or is unreadable — ignore.
            } finally {
                if (fs.existsSync(briefPath)) {
                    try {
                        updateStatusBar(fs.readFileSync(briefPath, 'utf-8'));
                    } catch { /* ignore */ }
                }
                isProcessing = false;
                // If a brief change arrived while we were processing, re-trigger
                // after a short delay so we don't miss the next step transition.
                if (pendingRecheck && lastBriefUri) {
                    pendingRecheck = false;
                    setTimeout(() => onBriefChanged(lastBriefUri!), 3000);
                }
            }
        }, 3000);
    }

    // Watch for changes and creation of active-brief.md.
    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(projectFolder, '.github/ai/active-brief.md')
    );
    watcher.onDidChange(onBriefChanged);
    watcher.onDidCreate(onBriefChanged);
    context.subscriptions.push(watcher);

    // ── QA Brief watcher ────────────────────────────────────────────────────────

    const qaBriefPath = path.join(projectFolder.uri.fsPath, '.github', 'ai', 'active-qa-brief.md');
    let qaNotifiedSteps = new Set<number>(
        context.workspaceState.get<number[]>('projectWorkflow.qaNotifiedSteps', [])
    );
    let qaKnownTicketId: string = context.workspaceState.get<string>('projectWorkflow.qaTicketId', '');

    function persistQaState(): void {
        context.workspaceState.update('projectWorkflow.qaNotifiedSteps', [...qaNotifiedSteps]);
        context.workspaceState.update('projectWorkflow.qaTicketId', qaKnownTicketId);
    }

    function resetQaNotificationState(): void {
        qaNotifiedSteps.clear();
        qaKnownTicketId = '';
        persistQaState();
    }

    // Pre-seed QA notified steps on activation so a reload does not replay QA-1.
    if (qaNotifiedSteps.size === 0 && fs.existsSync(qaBriefPath)) {
        try {
            const initialQaContent = fs.readFileSync(qaBriefPath, 'utf-8');
            const initialQaState = parseQaBrief(initialQaContent);
            if (initialQaState.ticketId && (qaKnownTicketId === '' || qaKnownTicketId === initialQaState.ticketId)) {
                for (const step of initialQaState.completedSteps) {
                    qaNotifiedSteps.add(step);
                }
                qaKnownTicketId = initialQaState.ticketId;
                persistQaState();
            }
        } catch { /* ignore */ }
    }

    let qaDebounceTimer: NodeJS.Timeout | undefined;
    let qaIsProcessing = false;
    let qaPendingRecheck = false;
    let lastQaBriefUri: vscode.Uri | undefined;

    async function onQaBriefChanged(uri: vscode.Uri): Promise<void> {
        lastQaBriefUri = uri;
        if (qaDebounceTimer) { clearTimeout(qaDebounceTimer); }
        qaDebounceTimer = setTimeout(async () => {
            qaDebounceTimer = undefined;
            if (qaIsProcessing) {
                qaPendingRecheck = true;
                return;
            }
            qaIsProcessing = true;

            try {
                const content = fs.readFileSync(uri.fsPath, 'utf-8');
                const result = processQaBriefChange(content, {
                    notifiedSteps: qaNotifiedSteps,
                    knownTicketId: qaKnownTicketId,
                    lastOpenedCommand,
                    lastOpenedAt,
                }, { now: Date.now() });

                qaNotifiedSteps = result.session.notifiedSteps;
                qaKnownTicketId = result.session.knownTicketId;
                lastOpenedCommand = result.session.lastOpenedCommand;
                lastOpenedAt = result.session.lastOpenedAt ?? 0;
                persistQaState();

                const action = result.action;
                if (action.kind === 'open' && action.command && action.label) {
                    const transitionDelayMs = getTransitionDelayMs();
                    if (transitionDelayMs > 0) {
                        await showStepTransitionNotification(
                            `QA Step ${action.step} complete. Waiting ${Math.round(transitionDelayMs / 1000)}s before starting ${action.label}…`,
                            transitionDelayMs
                        );
                    }

                    void showStepTransitionNotification(
                        `QA Step ${action.step} complete. Starting ${action.label}…`
                    );
                    await openNewAgentChat(action.command, true);
                    void scheduleAutoKeepLoop();
                }
            } catch { /* ignore */ } finally {
                qaIsProcessing = false;
                if (qaPendingRecheck && lastQaBriefUri) {
                    qaPendingRecheck = false;
                    setTimeout(() => onQaBriefChanged(lastQaBriefUri!), 3000);
                }
            }
        }, 3000);
    }

    const qaWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(projectFolder, '.github/ai/active-qa-brief.md')
    );
    qaWatcher.onDidChange(onQaBriefChanged);
    qaWatcher.onDidCreate(onQaBriefChanged);
    context.subscriptions.push(qaWatcher);

    // ── Commands ────────────────────────────────────────────────────────────────

    function resetDevNotificationState(): void {
        notifiedSteps.clear();
        knownTicketId = '';
        lastNotifiedBlockedLoop = -1;
        lastNotifiedCodeFixLoop = -1;
        pendingReworkReturn = null;
        persistState();
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('projectWorkflow.startDevTicket', async () => {
            const ticketId = await promptTicketId('dev');
            if (!ticketId) { return; }
            resetDevNotificationState();
            resetQaNotificationState();
            await openNewAgentChat(`/intake-agent ${ticketId}`);
            void scheduleAutoKeepLoop();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('projectWorkflow.startQaTicket', async () => {
            const ticketId = await promptTicketId('qa');
            if (!ticketId) { return; }
            resetQaNotificationState();
            await openNewAgentChat(`/qa-intake ${ticketId}`);
            void scheduleAutoKeepLoop();
        })
    );

    // Manual trigger: open the next step based on current brief state.
    context.subscriptions.push(
        vscode.commands.registerCommand('projectWorkflow.openNextStep', async () => {
            if (!fs.existsSync(briefPath)) {
                vscode.window.showWarningMessage('No active-brief.md found. Run /intake-agent first.');
                return;
            }
            const content = fs.readFileSync(briefPath, 'utf-8');
            const state = parseBrief(content);

            // Code-fix blocks take priority over normal step progression.
            if (state.codeFixBlockedSteps.size > 0) {
                const reworkCap = getReworkLoopCap();
                if (state.reworkLoops >= reworkCap) {
                    const blockedStepNames = [...state.codeFixBlockedSteps].join(', ');
                    await vscode.window.showErrorMessage(
                        `Project Workflow: rework loop cap reached (${state.reworkLoops} of ${reworkCap} allowed) on step(s) ${blockedStepNames}. ` +
                        `Investigate manually, then use this command again after resolving the root cause.`,
                        { modal: true },
                        'Dismiss'
                    );
                    return;
                }
                const firstBlockedStep = [...state.codeFixBlockedSteps][0];
                const codeFixTarget = getReviewReworkAgent(firstBlockedStep, 'code');
                await openNewAgentChat(codeFixTarget.command);
                void scheduleAutoKeepLoop();
                return;
            }

            // Blocked review step takes priority: rework loop is needed.
            const blockedReviewStep = blockedReviewStepOf(state);

            if (blockedReviewStep && state.reviewVerdict === 'blockers') {
                const reworkCap = getReworkLoopCap();
                if (state.reworkLoops >= reworkCap) {
                    await vscode.window.showErrorMessage(
                        `Project Workflow: rework loop cap reached (${state.reworkLoops} of ${reworkCap} allowed) on step ${blockedReviewStep}. ` +
                        `Investigate manually, then use this command again after resolving the root cause.`,
                        { modal: true },
                        'Dismiss'
                    );
                    return;
                }
                const reworkTarget = getReviewReworkAgent(blockedReviewStep, state.reworkKind);
                await openNewAgentChat(reworkTarget.command);
                void scheduleAutoKeepLoop();
                return;
            }

            // Normal step progression: find the last completed step and route to next.
            const completedInOrder = STEP_ORDER.filter(s => state.completedSteps.has(s));
            const lastCompleted = completedInOrder.length > 0
                ? completedInOrder[completedInOrder.length - 1]
                : '0';
            if (lastCompleted !== '0' && !stepReadyToAdvance(content, lastCompleted)) {
                vscode.window.showWarningMessage(
                    `Project Workflow: Step ${lastCompleted} is marked complete, but its summary is not in the brief yet. Wait for the agent to finish writing, then try again.`
                );
                return;
            }
            const next = getNextStep(lastCompleted, state.track);
            if (next) {
                await openNewAgentChat(next.command);
                void scheduleAutoKeepLoop();
            } else if (lastCompleted === '7F' || (lastCompleted === '7' && state.track !== 'full-stack')) {
                vscode.window.showInformationMessage('Project Workflow: all steps complete for this ticket.');
            } else {
                vscode.window.showInformationMessage('Project Workflow: no completed steps found in brief.');
            }
        })
    );

    // Manual trigger: open the next QA step based on current QA brief state.
    context.subscriptions.push(
        vscode.commands.registerCommand('projectWorkflow.openNextQaStep', async () => {
            if (!fs.existsSync(qaBriefPath)) {
                vscode.window.showWarningMessage('No active-qa-brief.md found. Run /qa-intake first.');
                return;
            }
            const content = fs.readFileSync(qaBriefPath, 'utf-8');
            const state = parseQaBrief(content);

            const lastCompleted = state.completedSteps.size > 0
                ? Math.max(...state.completedSteps)
                : 0;
            if (lastCompleted > 0 && !qaStepReadyToAdvance(content, lastCompleted)) {
                vscode.window.showWarningMessage(
                    `Project Workflow: QA Step ${lastCompleted} is marked complete, but its summary is not in the brief yet. Wait for the agent to finish writing, then try again.`
                );
                return;
            }
            const next = getNextQaStep(lastCompleted);
            if (next) {
                await openNewAgentChat(next.command);
                void scheduleAutoKeepLoop();
            } else if (lastCompleted === 4) {
                vscode.window.showInformationMessage('Project Workflow: all QA steps complete.');
            } else {
                vscode.window.showInformationMessage('Project Workflow: no completed QA steps found in brief.');
            }
        })
    );

    // Reset state when starting a new ticket manually (e.g., if brief was replaced outside an agent).
    context.subscriptions.push(
        vscode.commands.registerCommand('projectWorkflow.resetState', () => {
            resetDevNotificationState();
            resetQaNotificationState();
            updateStatusBar();
            vscode.window.showInformationMessage('Project Workflow: notification state reset (dev + QA).');
        })
    );
}

export function deactivate(): void { /* nothing to clean up */ }
