# Cursor execution mode

Run workflow slash commands in Agent mode. Never call `switch_mode` from inside a workflow step. If editing is unavailable because the chat is in Plan or design-only mode, ask the user to select Agent in the mode dropdown; do not fall back to a plan-only response and mark the stage complete.
