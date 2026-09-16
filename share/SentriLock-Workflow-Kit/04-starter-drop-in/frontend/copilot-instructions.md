# Frontend agent instructions (starter)

Copy to **the frontend repository's `.github/copilot-instructions.md`**.

The IDE applies this file while agents work in that repository. Workflow prompts explicitly
read the main workflow repository's `.github/copilot-instructions.md` and `PROJECT.md`; configure
the frontend repository, commands, paths, and local URL there. In a single repository, use the
main instructions file and do not install this second copy.

---

## Stack

- Commands and local app URL: `.github/ai/PROJECT.md` in the workflow repository

## Conventions

- Follow existing component and naming patterns in the file being modified.
- Verify changed UI in the browser (or your closest substitute) before marking a step Complete.
- Do not invent API field names — read the vault note or the backend contract first.
- Safety gates: no commit, push, or production deploy without an explicit human.

## Tests

- Colocate tests with the existing test tree.
- Cover empty, error, and permission-denied states, not only the happy path.
