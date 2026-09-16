# Prompt customization

The supplied prompts are project-neutral but deliberately detailed. They contain the pipeline's gates, status-last ordering, rework rules, review rubrics, summary formats, and extension wire protocol. Keep that structure shared unless a project needs a genuinely different stage or approval rule.

Prefer changing, in order:
1. `PROJECT.md` for commands, paths, environments, repositories, roles, and feature flags
2. `.github/copilot-instructions.md` for coding conventions and architecture
3. domain/test docs for detailed project knowledge
4. prompts only for workflow behavior shared configuration cannot express

Never duplicate credentials, URLs, fixture IDs, or named users into prompts.

Do not shorten a prompt merely because its commands moved to `PROJECT.md`: configuration is
project-owned, but process logic remains prompt-owned. Do not rename a prompt, summary heading,
progress row, status marker, or learning-log file without updating `briefRouting.ts`, the CLI
router, command aliases, and tests together.
