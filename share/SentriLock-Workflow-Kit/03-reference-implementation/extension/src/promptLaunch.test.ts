import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    parseSlashCommand,
    resolvePromptFile,
    planCursorLaunch,
    CURSOR_CREATE_AGENT_ARGS,
    CURSOR_SLASH_ALIASES,
    cursorSlashName,
    cursorSlashTriggersPlanNudge,
} from './promptLaunch';

function aiFile(name: string): string {
    const installedPath = path.resolve(__dirname, '../../../.github/ai', name);
    const kitPath = path.resolve(__dirname, '../../ai', name);
    return fs.existsSync(installedPath) ? installedPath : kitPath;
}

describe('parseSlashCommand', () => {
    it('splits /intake-agent DEMO-123', () => {
        assert.deepEqual(parseSlashCommand('/intake-agent DEMO-123'), {
            name: 'intake-agent',
            extra: 'DEMO-123',
        });
    });

    it('handles /reviewer with no args', () => {
        assert.deepEqual(parseSlashCommand('/reviewer'), {
            name: 'reviewer',
            extra: '',
        });
    });

    it('trims whitespace and accepts a missing slash', () => {
        assert.deepEqual(parseSlashCommand('  frontend-reviewer  '), {
            name: 'frontend-reviewer',
            extra: '',
        });
    });
});

describe('resolvePromptFile', () => {
    it('uses the newer of .cursor/commands and .github/prompts', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-prompt-'));
        const cursorPath = path.join(root, '.cursor', 'commands', 'reviewer.md');
        const githubPath = path.join(root, '.github', 'prompts', 'reviewer.prompt.md');
        try {
            fs.mkdirSync(path.join(root, '.cursor', 'commands'), { recursive: true });
            fs.mkdirSync(path.join(root, '.github', 'prompts'), { recursive: true });
            fs.writeFileSync(cursorPath, 'cursor body');
            const older = Date.now() - 60_000;
            fs.utimesSync(cursorPath, older / 1000, older / 1000);
            fs.writeFileSync(githubPath, 'github body');

            assert.equal(resolvePromptFile(root, 'reviewer', true), githubPath);

            const newer = Date.now() + 60_000;
            fs.utimesSync(cursorPath, newer / 1000, newer / 1000);
            assert.equal(resolvePromptFile(root, 'reviewer', true), cursorPath);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('returns undefined when no prompt file exists', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-prompt-'));
        try {
            assert.equal(resolvePromptFile(root, 'reviewer'), undefined);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('planCursorLaunch', () => {
    it('returns the slash token for the picker, not the prompt body', () => {
        const plan = planCursorLaunch('/tmp', '/reviewer');
        assert.equal(plan.slash, '/reviewer');
        assert.equal(plan.extra, '');
    });

    it('keeps ticket args off the slash token', () => {
        const plan = planCursorLaunch(undefined, '/intake-agent DEMO-123');
        assert.equal(plan.slash, '/intake-agent');
        assert.equal(plan.extra, 'DEMO-123');
    });

    it('maps Plan-nudge command names to safe Cursor slash tokens', () => {
        assert.equal(planCursorLaunch(undefined, '/backend-implementation').slash, '/backend-code');
        assert.equal(planCursorLaunch(undefined, '/frontend-implementation').slash, '/frontend-code');
        assert.equal(planCursorLaunch(undefined, '/api-execution').slash, '/api-run');
        assert.equal(planCursorLaunch(undefined, '/workflow').slash, '/project-flow');
        assert.equal(planCursorLaunch(undefined, '/qa-workflow').slash, '/qa-flow');
    });
});

describe('CURSOR_SLASH_ALIASES', () => {
    it('avoids every Cursor Plan-nudge substring', () => {
        for (const [canonical, alias] of Object.entries(CURSOR_SLASH_ALIASES)) {
            assert.equal(cursorSlashTriggersPlanNudge(canonical), true, `${canonical} should be aliased`);
            assert.equal(cursorSlashTriggersPlanNudge(alias), false, `${alias} must not nudge Plan`);
            assert.equal(cursorSlashName(canonical), alias);
            assert.equal(
                cursorSlashTriggersPlanNudge(`project/${alias}`),
                false,
                `workspace-prefixed ${alias} must not nudge Plan`
            );
        }
    });

    it('loads the committed JSON source of truth', () => {
        const aliasPath = aiFile('cursor-slash-aliases.json');
        const fromDisk = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
        assert.deepEqual({ ...CURSOR_SLASH_ALIASES }, fromDisk);
    });
});

describe('CURSOR_CREATE_AGENT_ARGS', () => {
    it('forces Agent and does not attach the current editor selection', () => {
        assert.equal(CURSOR_CREATE_AGENT_ARGS.unifiedMode, 'agent');
        assert.equal(CURSOR_CREATE_AGENT_ARGS.insertSelection, false);
        assert.equal(CURSOR_CREATE_AGENT_ARGS.openInNewTab, true);
    });
});

describe('CURSOR_AGENT_MODE.md', () => {
    it('forbids switch_mode and plan-only fallback when Plan blocks edits', () => {
        const modePath = aiFile('CURSOR_AGENT_MODE.md');
        const text = fs.readFileSync(modePath, 'utf8');
        assert.match(text, /switch_mode/);
        assert.match(text, /Never/);
        assert.match(text, /design-only|plan-only/i);
        assert.match(text, /mode dropdown/i);
        assert.doesNotMatch(text, /switch to Agent mode/i);
    });
});
