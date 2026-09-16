# Frontend browser verification (Steps 2F / 6F)

Required when frontend views, routes, or user-visible behavior changed. Skip only when the Step 2F Summary says "No frontend changes required".

Read `.github/ai/PROJECT.md` first for the frontend repository, the **Start local app** command, the local frontend URL, the environment base URLs, and the fixture-role variable keys. If any required field still contains an angle-bracket placeholder (`<...>`), or an optional stage still reads `enabled | disabled`, stop and name the unresolved setting — never guess it.

Do **not** write a committed browser-automation spec. Use the browser automation tools available in the chat (navigate, snapshot, click, type, fill form, press key, console, network). Exercise the app the way a user would — a screenshot alone is not verification.

## 1. Boot the local frontend

Treat the local frontend URL as ready **only if both** are true:

1. The configured dev-server process is actually listening (check with `pgrep -fl '<dev server process pattern>'`).
2. A request to that URL returns HTML containing the app's root element or shell marker (`PROJECT.md` → Paths → Frontend components, or the documented root selector). A 200 from some other process on the same port does **not** count.

If the port is occupied by something else, do not reuse it — stop and tell the user.

If it is not ready, run the configured **Start local app** command from the frontend repository root:

```bash
<PROJECT.md → Commands → Start local app>
```

Wait until the terminal prints its ready line with the served URL. Do not start a second copy.

The local frontend points at whichever backend its own environment file configures — usually a shared test environment, not your machine. Do not start a local API unless the brief says the UI must hit the local base URL (`PROJECT.md` → Test environments → Local).

Remember whether **you** started the server.

## 2. Authenticate (do not leak the password)

- If the browser is already on an authenticated page of this app, reuse the session.
- Confirm the credential variables exist **without printing values**:

```bash
# Run from the repository root that contains .github/ai (not the frontend subfolder).
set -a && source ./.env.local && set +a
if [ -z "${<FRONTEND_USER_VAR>:-}" ] || [ -z "${<FRONTEND_PASS_VAR>:-}" ]; then
  echo "frontend login credentials missing"
  exit 1
fi
echo "frontend login credentials present"
```

If your shell is already inside the frontend repository, source the env file from the parent repository path instead.

- Fill **username** with the browser tools using the fixture-role user variable (`PROJECT.md` → Fixture roles).
- Fill **password** via the clipboard so the password value never appears in a tool argument. Clipboard paste below is **macOS** (`pbcopy`). On Linux/Windows, treat login as **Playwright: ⚠️ Skipped — auth/environment** and continue.
  1. Focus the identity provider's password field.
  2. In the terminal: `printf '%s' "$<FRONTEND_PASS_VAR>" | pbcopy`
  3. Paste in the page (`Meta+v` on macOS).
  4. Clear the clipboard: `pbcopy < /dev/null`
- Never write the password variable or its value into `active-brief.md`, summaries, Open Items, or follow-up chat. You may record "logged in as `<FRONTEND_USER_VAR>`".
- If the variables are missing or the external identity provider blocks login, record **Playwright: ⚠️ Skipped — auth/environment** and continue. Do not invent credentials.

## 3. Click the change

- Open every new or modified route from the Step 2F Summary (and deep links / sibling entry paths from the regression scan).
- Exercise each frontend AC: click, type, submit, navigate. Confirm the visible result.
- Re-check at least one **unchanged sibling path** from the regression scan (View vs Edit vs Add, or the other bootstrap entry).
- Read console messages and failed network calls. New errors on the changed path are in-scope findings.

## 4. Tear down

- If **you** started the dev server, stop it when the browser pass finishes (kill the process you launched, or close that terminal).
- If you reused a server that was already running, leave it running.

## 5. Record

Implementation (2F): **Browser verification** in the Step 2F Summary — local URL, flows exercised, AC pass/fail, sibling-path result, or auth-skip reason. Fix in-scope bugs before writing the summary.

Reviewer (6F): same fields in the Step 6F Summary. A failed AC or in-scope sibling regression in the browser is a **BLOCKER** (`code`). An auth/environment skip is a **WARNING**, not a code blocker.
