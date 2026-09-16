#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prompts = path.join(root, '.github', 'prompts');
const commands = path.join(root, '.cursor', 'commands');
const directivePath = path.join(root, '.github', 'ai', 'CURSOR_AGENT_MODE.md');
const aliasesPath = path.join(root, '.github', 'ai', 'cursor-slash-aliases.json');

if (!fs.existsSync(directivePath)) {
  throw new Error(`Missing required Cursor mode directive: ${path.relative(root, directivePath)}`);
}
const directiveText = fs.readFileSync(directivePath, 'utf8').trim();
if (!/switch_mode/i.test(directiveText) || !/\bnever\b/i.test(directiveText)) {
  throw new Error('CURSOR_AGENT_MODE.md must explicitly forbid switch_mode.');
}
if (!fs.existsSync(aliasesPath)) {
  throw new Error(`Missing required Cursor slash aliases: ${path.relative(root, aliasesPath)}`);
}
const aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
const planNudgeKeywords = [
  'plan', 'planning', 'refactor', 'migrate', 'restructure', 'design', 'architect',
  'spec', 'specify', 'outline', 'draft', 'blueprint', 'proposal', 'roadmap',
  'strategy', 'approach', 'steps', 'checklist', 'timeline', 'milestones',
  'phased', 'staged', 'rollout', 'implementation', 'execution', 'workflow',
  'scope', 'estimate', 'breakdown', 'todo', 'acceptance criteria',
];
for (const [canonical, alias] of Object.entries(aliases)) {
  if (typeof alias !== 'string' || !alias || planNudgeKeywords.some(keyword => alias.toLowerCase().includes(keyword))) {
    throw new Error(`Cursor alias for "${canonical}" is empty or Plan-nudge-unsafe: "${alias}"`);
  }
}
const directive = directiveText + '\n\n';
fs.mkdirSync(commands, { recursive: true });

function stripFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('---', 3);
  return end < 0 ? text : text.slice(end + 3).replace(/^\s*\n/, '');
}

for (const file of fs.readdirSync(prompts).filter(f => f.endsWith('.prompt.md'))) {
  const name = file.replace(/\.prompt\.md$/, '');
  const cursorName = aliases[name] ?? name;
  const body = stripFrontmatter(fs.readFileSync(path.join(prompts, file), 'utf8'));
  const header = `> Project configuration: read \`.github/ai/PROJECT.md\` first.\n> Run this command in Agent mode. Do not guess unresolved placeholders.\n\n`;
  fs.writeFileSync(path.join(commands, `${cursorName}.md`), directive + header + body);
  if (cursorName !== name) {
    fs.rmSync(path.join(commands, `${name}.md`), { force: true });
  }
}
console.log(`Generated Cursor commands in ${path.relative(root, commands)}`);
