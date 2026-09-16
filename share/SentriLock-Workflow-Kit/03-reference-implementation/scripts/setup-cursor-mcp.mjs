#!/usr/bin/env node
/**
 * Create or refresh .cursor/mcp.json for Cursor IDE Agent chats.
 *
 * Sources (first match wins):
 *   1. .vscode/mcp.json  (VS Code / Copilot format)
 *   2. .env.local        (JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN, CONFLUENCE_*)
 *   3. .cursor/mcp.json.example
 *
 * Usage:
 *   node scripts/setup-cursor-mcp.mjs
 *   node scripts/setup-cursor-mcp.mjs --force
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vscodePath = path.join(repoRoot, '.vscode', 'mcp.json');
const cursorPath = path.join(repoRoot, '.cursor', 'mcp.json');
const examplePath = path.join(repoRoot, '.cursor', 'mcp.json.example');
const envPath = path.join(repoRoot, '.env.local');

const force = process.argv.includes('--force');

function stripJsonComments(text) {
  return text.replace(/^\s*\/\/.*$/gm, '');
}

function loadDotEnvLocal() {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function fromVscode() {
  if (!fs.existsSync(vscodePath)) {
    return null;
  }
  const raw = stripJsonComments(fs.readFileSync(vscodePath, 'utf8'));
  const parsed = JSON.parse(raw);
  const servers = parsed.servers ?? parsed.mcpServers ?? parsed;
  return { mcpServers: servers };
}

function fromEnvLocal() {
  const env = loadDotEnvLocal();
  if (!env.JIRA_URL || !env.JIRA_USERNAME || !env.JIRA_API_TOKEN) {
    return null;
  }

  const example = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  const jiraTemplate = example.mcpServers.jira;

  return {
    mcpServers: {
      jira: {
        ...jiraTemplate,
        env: {
          ...jiraTemplate.env,
          JIRA_URL: env.JIRA_URL,
          JIRA_USERNAME: env.JIRA_USERNAME,
          JIRA_API_TOKEN: env.JIRA_API_TOKEN,
          CONFLUENCE_URL: env.CONFLUENCE_URL ?? env.JIRA_URL.replace(/\/$/, '') + '/wiki',
          CONFLUENCE_USERNAME: env.CONFLUENCE_USERNAME ?? env.JIRA_USERNAME,
          CONFLUENCE_API_TOKEN: env.CONFLUENCE_API_TOKEN ?? env.JIRA_API_TOKEN,
        },
      },
    },
  };
}

function fromExample() {
  if (!fs.existsSync(examplePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(examplePath, 'utf8'));
}

function containsUnresolvedValue(value) {
  if (typeof value === 'string') {
    return value === 'REDACTED' || /<[^>]+>/.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(containsUnresolvedValue);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsUnresolvedValue);
  }
  return false;
}

if (fs.existsSync(cursorPath) && !force) {
  console.log('.cursor/mcp.json already exists — use --force to overwrite.');
  process.exit(0);
}

/** @type {{ config: { mcpServers: Record<string, unknown> } | null, source: string }} */
const built = (() => {
  const fromVs = fromVscode();
  if (fromVs) {
    return { config: fromVs, source: '.vscode/mcp.json' };
  }
  const fromEnv = fromEnvLocal();
  if (fromEnv) {
    return { config: fromEnv, source: '.env.local' };
  }
  const fromEx = fromExample();
  if (fromEx) {
    return { config: fromEx, source: 'mcp.json.example' };
  }
  return { config: null, source: '' };
})();

const config = built.config;
const source = built.source;

if (!config?.mcpServers?.jira || containsUnresolvedValue(config.mcpServers.jira)) {
  console.error('Could not build Jira MCP config.');
  console.error('The selected source is missing a jira server or still contains REDACTED/<...> values.');
  console.error('Provide one of:');
  console.error(`  - ${vscodePath}`);
  console.error(`  - JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN in ${envPath}`);
  console.error(`  - ${examplePath} (filled in manually)`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(cursorPath), { recursive: true });
fs.writeFileSync(cursorPath, JSON.stringify(config, null, 2) + '\n');

console.log(`Created ${cursorPath} from ${source}`);
console.log('Cursor IDE Agent chats will use this for Jira MCP.');
