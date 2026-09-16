# Test stack configuration

Put exact commands in `.github/ai/PROJECT.md`; prompts read them at runtime. Use `N/A` for unsupported commands and disable the corresponding optional stage.

Each command should be runnable from the repository root, non-interactive, and produce an exit code suitable for automation. Distinguish focused diagnostic commands from the required finish gate. Include environment setup in the command or document it immediately beside the command.
