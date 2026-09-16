/**
 * Persist workflow notification state (mirrors VS Code extension workspaceState).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'node:child_process';
import {
  createEmptyDevState,
  createEmptyQaState,
} from './project-workflow-router.mjs';

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function stateFilePath(repoRoot) {
  return path.join(repoRoot, '.cursor', 'workflow-state.json');
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function pendingFilePath(repoRoot) {
  return path.join(repoRoot, '.cursor', 'workflow-pending.json');
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function nextStepMarkdownPath(repoRoot) {
  return path.join(repoRoot, '.github', 'ai', 'NEXT_STEP.md');
}

/**
 * @param {string} repoRoot
 */
export function loadConfig(repoRoot) {
  const configPath = path.join(repoRoot, '.cursor', 'workflow-config.json');
  const defaults = {
    transitionDelayMs: 12000,
    reworkLoopCap: 5,
    debounceMs: 3000,
  };
  if (!fs.existsSync(configPath)) {
    return defaults;
  }
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch {
    return defaults;
  }
}

/**
 * @param {string} repoRoot
 */
export function loadState(repoRoot) {
  const file = stateFilePath(repoRoot);
  if (!fs.existsSync(file)) {
    return { dev: createEmptyDevState(), qa: createEmptyQaState() };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      dev: { ...createEmptyDevState(), ...parsed.dev },
      qa: { ...createEmptyQaState(), ...parsed.qa },
      lastProcessedAt: parsed.lastProcessedAt ?? 0,
      debounceTimer: parsed.debounceTimer ?? null,
    };
  } catch {
    return { dev: createEmptyDevState(), qa: createEmptyQaState() };
  }
}

/**
 * @param {string} repoRoot
 * @param {object} state
 */
export function saveState(repoRoot, state) {
  const dir = path.join(repoRoot, '.cursor');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(stateFilePath(repoRoot), JSON.stringify(state, null, 2) + '\n');
}

/**
 * @param {string} repoRoot
 */
export function resetState(repoRoot) {
  saveState(repoRoot, {
    dev: createEmptyDevState(),
    qa: createEmptyQaState(),
    lastProcessedAt: 0,
  });
  const pending = pendingFilePath(repoRoot);
  if (fs.existsSync(pending)) {
    fs.unlinkSync(pending);
  }
  const nextStep = nextStepMarkdownPath(repoRoot);
  if (fs.existsSync(nextStep)) {
    fs.unlinkSync(nextStep);
  }
}

/**
 * @param {string} repoRoot
 * @param {import('./project-workflow-router.mjs').TransitionResult} result
 */
export function writePendingTransition(repoRoot, result) {
  if (result.kind === 'none') {
    return;
  }

  const payload = {
    at: new Date().toISOString(),
    ...result,
  };

  fs.mkdirSync(path.join(repoRoot, '.cursor'), { recursive: true });
  fs.writeFileSync(pendingFilePath(repoRoot), JSON.stringify(payload, null, 2) + '\n');

  const lines = [
    '# Project Workflow — Next Step',
    '',
    `**${result.userTitle ?? 'Project Workflow'}**`,
    '',
    result.message ?? '',
    '',
  ];

  if (result.command) {
    lines.push('## Action', '', '1. Open a **new Agent chat** (fresh context per step).', `2. Run: \`${result.command}\``, '');
    lines.push('Command copied to clipboard when the watcher/hook fired.');
  }

  if (result.kind === 'loop_cap') {
    lines.push('## Loop cap', '', 'Automatic routing stopped. Investigate root cause, then:', '', '```bash', 'node scripts/project-workflow-open-next.mjs', '```', '');
  }

  fs.mkdirSync(path.join(repoRoot, '.github', 'ai'), { recursive: true });
  fs.writeFileSync(nextStepMarkdownPath(repoRoot), lines.join('\n'));
}

/**
 * @param {string} command
 */
export function copyToClipboard(command) {
  if (!command) {
    return;
  }
  if (process.platform === 'darwin') {
    try {
      spawnSync('pbcopy', { input: command });
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} title
 * @param {string} message
 */
export function showNotification(title, message) {
  if (process.platform === 'darwin') {
    try {
      const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`;
      spawnSync('osascript', ['-e', script]);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} repoRoot
 * @param {import('./project-workflow-router.mjs').TransitionResult} result
 * @param {{ transitionDelayMs?: number }} config
 */
export async function deliverTransition(repoRoot, result, config = {}) {
  if (result.kind === 'none') {
    return;
  }

  const delay = config.transitionDelayMs ?? 12000;
  if (delay > 0 && result.command) {
    await new Promise((r) => setTimeout(r, delay));
  }

  writePendingTransition(repoRoot, result);
  if (result.command) {
    copyToClipboard(result.command);
  }
  showNotification(result.userTitle ?? 'Project Workflow', result.message ?? result.command ?? '');
}
