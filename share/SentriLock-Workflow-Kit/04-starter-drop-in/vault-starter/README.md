# Domain vault (starter)

Replace this index with **your** nouns.

| Noun | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| Example entity | `GET-Example.md` | `POST-Example.md` | `PATCH-Example.md` | — |

## Recommended starter files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Behavioral law |
| `Identity-Patterns.md` | Caller shapes (no secrets) |
| `Engineering-Patterns.md` | Recurring mistakes and architecture patterns |
| `Contract-Test-Guide.md` | API/contract suite conventions |
| `Test-Fixtures.md` | Disposable fixture catalog |

These names are defaults, not parser contracts. Point `PROJECT.md` → Paths at the files you
keep or rename; ordinary project setup should not require editing every prompt.

## How to add a note

1. One file per verb + entity.
2. Headings: method, URI, status codes, required fields, example, links.
3. Put enums in `reference/codes.md`.
4. Put full request/response samples in `examples/`.
5. Link with `[[wikilinks]]`.

See the kit’s `02-porting/DOMAIN-VAULT.md`.
