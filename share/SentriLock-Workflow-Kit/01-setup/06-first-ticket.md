# First ticket (dummy)

Do this on a **throwaway** issue after `PROJECT.md`, `copilot-instructions.md`, and one test command are configured. Confirm slash commands exist (`01-setup/00-slash-commands.md`) or the first chat will ask “what should I do?”

## 1. Start

**Cmd+Shift+P → Project Workflow: Start Dev Ticket**  
Enter a ticket key, e.g. `DEMO-1`.

Or in Copilot Chat: `/intake-agent DEMO-1`  
On Cursor, Step 2’s chip is `/backend-code` (alias). The extension types that for you.

## 2. What intake should do

- Fetch or accept pasted ticket text
- Classify track
- Rewrite ACs as verb + observable outcome
- Fill the template including the progress table
- Write the **finished** brief with Step 1 blank, then mark Step 1 Complete as a final edit

If you see `⚠️ NEEDS CLARIFICATION`, fix the brief. The driver will not auto-advance.

## 3. Watch the handoff

After intake writes the file, wait ~3s debounce + ~12s transition. A new Agent chat should open for Step 2 (`/backend-implementation` in VS Code, `/backend-code` in Cursor).

If nothing happens: **Project Workflow: Open Next Step**. If it says the summary is missing, intake did not finish writing.

## 4. Walk as far as you can

On a dummy ticket you can stop after intake + a no-op implementation summary to prove the watcher. For a real ticket, do not mark Complete until that step’s work and summary exist.

## 5. Reset

**Project Workflow: Reset Notification State** before starting a second ticket by hand, or rely on a new Ticket ID (the extension clears session state when the id changes).
