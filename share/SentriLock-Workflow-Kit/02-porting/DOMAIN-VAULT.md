# Domain documentation

Agents invent field names when the domain is not in files they can walk.

## Minimum vault

```
vault/
  AGENTS.md          # MUST / MUST NOT for your API or product
  README.md          # index: noun → how to do the thing
  <one note per operation>
  examples/          # real response shapes
  reference/         # enums / status codes
```

Copy `04-starter-drop-in/vault-starter/` and replace the placeholders.

## Recommended structure

1. One note per verb and entity (`GET-Example.md`, not one unstructured API dump)
2. Same headings every time
3. Wikilinks between notes
4. Examples are JSON (or your wire format) with **real field names**
5. Enums live in one reference file
6. **Write-back:** if implementation learns a missing rule, edit the existing note in the same change
7. `AGENTS.md` is law (PATCH/GET semantics, auth header rules, rate limits, “never hardcode ids”)

The documentation tool is optional. Walkable, committed files are not.

## Point the prompts at it

Set `PROJECT.md` → Paths → **Domain documentation**, **Domain rules file**, **Recurring
patterns**, **Status and domain codes**, **Fixture catalog**, and **Identity/caller patterns**.
The prompts already read those keys; do not search/replace vault paths inside prompt files.
