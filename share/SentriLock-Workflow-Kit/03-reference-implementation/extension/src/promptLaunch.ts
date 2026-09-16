// Slash-command parsing for opening Agent chats.
// Kept free of vscode imports so it can be unit-tested with node:test.

import * as fs from 'fs';
import * as path from 'path';

export interface ParsedSlashCommand {
    name: string;
    extra: string;
}

export function parseSlashCommand(command: string): ParsedSlashCommand {
    const trimmed = command.trim();
    const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    const space = withoutSlash.indexOf(' ');
    if (space === -1) {
        return { name: withoutSlash, extra: '' };
    }
    return {
        name: withoutSlash.slice(0, space),
        extra: withoutSlash.slice(space + 1).trim(),
    };
}

/**
 * Cursor slash-command picker: when both copies exist, use the newer file.
 * Used only for path resolution — launch types `/name` so the picker binds the chip.
 */
export function resolvePromptFile(
    gatewayRoot: string,
    commandName: string,
    preferCursorCommand = true
): string | undefined {
    if (!commandName) {
        return undefined;
    }
    const cursorName = cursorSlashName(commandName, gatewayRoot);
    const cursorCmd = path.join(gatewayRoot, '.cursor', 'commands', `${cursorName}.md`);
    const cursorLegacy = path.join(gatewayRoot, '.cursor', 'commands', `${commandName}.md`);
    const githubPrompt = path.join(gatewayRoot, '.github', 'prompts', `${commandName}.prompt.md`);
    const cursorPath = fs.existsSync(cursorCmd)
        ? cursorCmd
        : fs.existsSync(cursorLegacy)
            ? cursorLegacy
            : undefined;
    const githubExists = fs.existsSync(githubPrompt);

    if (cursorPath && githubExists) {
        const cursorMtime = fs.statSync(cursorPath).mtimeMs;
        const githubMtime = fs.statSync(githubPrompt).mtimeMs;
        if (githubMtime > cursorMtime) {
            return githubPrompt;
        }
        if (cursorMtime > githubMtime) {
            return cursorPath;
        }
        return preferCursorCommand ? cursorPath : githubPrompt;
    }
    if (preferCursorCommand && cursorPath) {
        return cursorPath;
    }
    if (githubExists) {
        return githubPrompt;
    }
    if (cursorPath) {
        return cursorPath;
    }
    return undefined;
}

export interface CursorLaunchPlan {
    /** Typed into the composer so the slash picker can bind a command chip. */
    slash: string;
    extra: string;
}

/**
 * Args for Cursor `composer.createNew`.
 * unifiedMode must be agent (chat.open / a bare createNew inherit last mode, often Plan).
 * insertSelection must stay false so the current editor/terminal selection is not
 * attached to the workflow chat.
 */
export const CURSOR_CREATE_AGENT_ARGS = {
    unifiedMode: 'agent' as const,
    openInNewTab: true,
    insertSelection: false,
};

/**
 * Cursor `shouldSuggestPlanMode` does `text.toLowerCase().includes(keyword)`.
 * Slash chip text is `` `/${name}` `` — names containing those substrings flip
 * the chat to Plan ~0.5s after the chip binds (before submit). Keep VS Code /
 * briefRouting on the canonical names; map only the Cursor picker token.
 *
 * Committed source of truth: `.github/ai/cursor-slash-aliases.json`.
 * This object is the runtime fallback when that file is not available from the
 * workspace (must stay identical — enforced by unit test).
 */
export const CURSOR_SLASH_ALIASES: Readonly<Record<string, string>> = {
    'backend-implementation': 'backend-code',
    'frontend-implementation': 'frontend-code',
    'api-execution': 'api-run',
    'workflow': 'project-flow',
    'qa-workflow': 'qa-flow',
};

/** Substrings Cursor uses for Plan-mode suggestion (must not appear in aliases). */
export const CURSOR_PLAN_NUDGE_KEYWORDS = [
    'plan',
    'planning',
    'refactor',
    'migrate',
    'restructure',
    'design',
    'architect',
    'spec',
    'specify',
    'outline',
    'draft',
    'blueprint',
    'proposal',
    'roadmap',
    'strategy',
    'approach',
    'steps',
    'checklist',
    'timeline',
    'milestones',
    'phased',
    'staged',
    'rollout',
    'implementation',
    'execution',
    'workflow',
    'scope',
    'estimate',
    'breakdown',
    'todo',
    'acceptance criteria',
    'definition of done',
] as const;

function loadCursorSlashAliases(gatewayRoot?: string): Readonly<Record<string, string>> {
    if (!gatewayRoot) {
        return CURSOR_SLASH_ALIASES;
    }
    const aliasPath = path.join(gatewayRoot, '.github', 'ai', 'cursor-slash-aliases.json');
    try {
        if (fs.existsSync(aliasPath)) {
            const parsed = JSON.parse(fs.readFileSync(aliasPath, 'utf8')) as Record<string, string>;
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
    } catch {
        /* use baked-in fallback */
    }
    return CURSOR_SLASH_ALIASES;
}

export function cursorSlashName(canonicalName: string, gatewayRoot?: string): string {
    return loadCursorSlashAliases(gatewayRoot)[canonicalName] ?? canonicalName;
}

export function cursorSlashTriggersPlanNudge(slashName: string): boolean {
    const lower = slashName.toLowerCase();
    return CURSOR_PLAN_NUDGE_KEYWORDS.some(k => lower.includes(k));
}

export function planCursorLaunch(
    gatewayRoot: string | undefined,
    command: string
): CursorLaunchPlan {
    const { name, extra } = parseSlashCommand(command);
    return { slash: `/${cursorSlashName(name, gatewayRoot)}`, extra };
}
