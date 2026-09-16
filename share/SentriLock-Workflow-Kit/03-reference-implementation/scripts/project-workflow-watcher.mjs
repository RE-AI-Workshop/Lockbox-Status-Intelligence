#!/usr/bin/env node
/**
 * Background notification fallback when the IDE extension cannot be installed.
 * Watches active-brief.md and active-qa-brief.md, tracks notified steps / rework loops,
 * and notifies when to start the next Agent chat. It does not auto-open chats and is
 * not a replacement for the extension's richer rework/cooldown handling.
 *
 * Usage:
 *   node scripts/project-workflow-watcher.mjs
 *
 * Run in a dedicated terminal while working through a ticket.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  evaluateDevBrief,
  evaluateQaBrief,
  parseBrief,
  parseQaBrief,
  seedDevStateFromBrief,
} from './lib/project-workflow-router.mjs';
import {
  deliverTransition,
  loadConfig,
  loadState,
  saveState,
} from './lib/project-workflow-state.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(repoRoot);

const devBriefPath = path.join(repoRoot, '.github', 'ai', 'active-brief.md');
const qaBriefPath = path.join(repoRoot, '.github', 'ai', 'active-qa-brief.md');

/** @type {ReturnType<typeof loadState>} */
let persisted = loadState(repoRoot);
let isProcessing = false;
let pendingRecheck = false;
/** @type {NodeJS.Timeout | null} */
let debounceTimer = null;

function persist() {
  saveState(repoRoot, persisted);
}

async function processDevBrief() {
  if (!fs.existsSync(devBriefPath)) {
    return;
  }

  const content = fs.readFileSync(devBriefPath, 'utf8');
  const briefState = parseBrief(content);
  persisted.dev = seedDevStateFromBrief(briefState, persisted.dev);

  const { result, state } = evaluateDevBrief(briefState, persisted.dev, config);
  persisted.dev = state;

  if (result.kind !== 'none') {
    console.log(`[dev] ${result.kind}: ${result.message ?? ''}`);
    await deliverTransition(repoRoot, result, config);
  }

  persist();
}

async function processQaBrief() {
  if (!fs.existsSync(qaBriefPath)) {
    return;
  }

  const content = fs.readFileSync(qaBriefPath, 'utf8');
  const briefState = parseQaBrief(content);

  if (persisted.qa.notifiedSteps.length === 0 && briefState.completedSteps.size > 0) {
    persisted.qa.notifiedSteps = [...briefState.completedSteps];
  }

  const { result, state } = evaluateQaBrief(briefState, persisted.qa);
  persisted.qa = state;

  if (result.kind !== 'none') {
    console.log(`[qa] ${result.kind}: ${result.message ?? ''}`);
    await deliverTransition(repoRoot, result, config);
  }

  persist();
}

async function runCycle() {
  if (isProcessing) {
    pendingRecheck = true;
    return;
  }
  isProcessing = true;
  try {
    await processDevBrief();
    await processQaBrief();
    persisted.lastProcessedAt = Date.now();
    persist();
  } catch (err) {
    console.error('[project-workflow-watcher] error:', err.message);
  } finally {
    isProcessing = false;
    if (pendingRecheck) {
      pendingRecheck = false;
      scheduleCycle(config.debounceMs);
    }
  }
}

function scheduleCycle(delayMs = config.debounceMs) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runCycle();
  }, delayMs);
}

function watchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  fs.watch(filePath, { persistent: true }, () => scheduleCycle());
}

console.log('Project Workflow Watcher — watching brief files (Ctrl+C to stop)');
console.log(`  dev: ${path.relative(repoRoot, devBriefPath)}`);
console.log(`  qa:  ${path.relative(repoRoot, qaBriefPath)}`);
console.log(`  transition delay: ${config.transitionDelayMs}ms | rework cap: ${config.reworkLoopCap}`);
console.log('');

// Pre-seed on startup (mirrors extension activation).
if (fs.existsSync(devBriefPath)) {
  const briefState = parseBrief(fs.readFileSync(devBriefPath, 'utf8'));
  persisted.dev = seedDevStateFromBrief(briefState, persisted.dev);
  persist();
}
if (fs.existsSync(qaBriefPath)) {
  const qaState = parseQaBrief(fs.readFileSync(qaBriefPath, 'utf8'));
  if (persisted.qa.notifiedSteps.length === 0) {
    persisted.qa.notifiedSteps = [...qaState.completedSteps];
    persist();
  }
}

watchFile(devBriefPath);
watchFile(qaBriefPath);

// Also watch for brief creation.
const aiDir = path.join(repoRoot, '.github', 'ai');
if (!fs.existsSync(aiDir)) {
  console.error('Missing .github/ai. Complete the workflow copy/setup steps first.');
  process.exit(1);
}
fs.watch(aiDir, { persistent: true }, (_event, filename) => {
  if (filename === 'active-brief.md' || filename === 'active-qa-brief.md') {
    scheduleCycle();
  }
});

