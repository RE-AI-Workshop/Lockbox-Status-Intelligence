# Identity as shapes (starter — no login map)

Prompts in the reference implementation require-read a file at this path. Replace the examples with **your** caller shapes. Do **not** paste production usernames or passwords here.

## Rule

Cover the **class of caller**, not a celebrity account. A privileged fixture user is how you **set the table**, not how you **prove the rule**.

## Shape ≠ person

A shape is a combination of columns/flags, for example (replace with yours):

| Shape id | What is different | Where to prove it |
|----------|-------------------|-------------------|
| P-staff-stub | Authenticated staff, no user row / resolver id 0 | Unit test |
| P-staff-user | Same UI, real user row | Unit test + suite |
| P-unaffiliated | Writer with sentinel person id | Suite |
| P-impersonate | Bearer token, not Basic | Suite only if you have that API |

Intake lists **applicable** shapes for *this* ticket. You do not test every shape every time.

## Fixture setup vs caller coverage

| Job | Who |
|-----|-----|
| Create/fix data so the test can run | Privileged fixture account |
| Prove the AC about **who the caller is** | That shape’s keys — never “fix” a 401 by switching to admin |

## Smoke

Smoke stays **liveness** as the fixture admin. Do not expand smoke to every shape.

## DEV login map (you fill this; keep it out of git if it has secrets)

If API suites need named env vars, list **exact key names** here (not passwords). Agents must copy those names. Do not invent `*_USER` keys that are not in this table.
