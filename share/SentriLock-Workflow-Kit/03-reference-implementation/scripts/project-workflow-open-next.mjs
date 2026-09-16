#!/usr/bin/env node
/**
 * Evaluate brief state and print the next workflow command (manual "Open Next Step").
 *
 * Usage:
 *   node scripts/project-workflow-open-next.mjs           # dev brief
 *   node scripts/project-workflow-open-next.mjs --qa      # QA brief
 *   node scripts/project-workflow-open-next.mjs --reset   # reset tracking state
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseBrief,
  parseQaBrief,
  resolveManualDevNext,
  resolveManualQaNext,
} from './lib/project-workflow-router.mjs';
import {
  copyToClipboard,
  deliverTransition,
  loadConfig,
  resetState,
  showNotification,
} from './lib/project-workflow-state.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isQa = args.includes('--qa');
const isReset = args.includes('--reset');
const notify = !args.includes('--no-notify');

if (isReset) {
  resetState(repoRoot);
  console.log('Project Workflow: notification state reset (dev + QA).');
  process.exit(0);
}

const config = loadConfig(repoRoot);

if (isQa) {
  const qaBriefPath = path.join(repoRoot, '.github', 'ai', 'active-qa-brief.md');
  if (!fs.existsSync(qaBriefPath)) {
    console.error('No active-qa-brief.md found. Run /qa-intake first.');
    process.exit(1);
  }
  const result = resolveManualQaNext(parseQaBrief(fs.readFileSync(qaBriefPath, 'utf8')));
  console.log(result.message ?? 'No action.');
  if (result.command) {
    copyToClipboard(result.command);
    console.log(`Copied to clipboard: ${result.command}`);
  }
  if (notify && result.kind !== 'none') {
    showNotification(result.userTitle ?? 'Project Workflow', result.message ?? '');
  }
  process.exit(result.kind === 'loop_cap' ? 2 : 0);
}

const briefPath = path.join(repoRoot, '.github', 'ai', 'active-brief.md');
if (!fs.existsSync(briefPath)) {
  console.error('No active-brief.md found. Run /intake-agent first.');
  process.exit(1);
}

const result = resolveManualDevNext(parseBrief(fs.readFileSync(briefPath, 'utf8')), config);
console.log(result.message ?? 'No action.');
if (result.command) {
  copyToClipboard(result.command);
  console.log(`Copied to clipboard: ${result.command}`);
}
if (notify && result.kind !== 'none') {
  await deliverTransition(repoRoot, result, { transitionDelayMs: 0 });
}
process.exit(result.kind === 'loop_cap' ? 2 : 0);
